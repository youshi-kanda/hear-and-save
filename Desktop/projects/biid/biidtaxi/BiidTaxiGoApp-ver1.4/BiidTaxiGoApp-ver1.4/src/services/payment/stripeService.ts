import {
  initPaymentSheet,
  presentPaymentSheet,
  PaymentSheetError,
  PlatformPay,
  isPlatformPaySupported,
  confirmPlatformPayPayment,
  PlatformPayButton,
} from '@stripe/stripe-react-native';
import {apiClient} from '../api/client';
import {ApiResponse} from '../api/types';

export interface PaymentIntentResponse {
  clientSecret: string;
  publishableKey: string;
  customerId?: string;
  ephemeralKey?: string;
}

export interface PaymentRequest {
  amount: number; // 金額（円）
  currency: string;
  booking_id: string;
  booking_type: 'taxi' | 'ship';
  payment_method?: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  error?: string;
}

export interface QRPaymentIntent {
  qr_code: string; // QRコードのデータ（base64またはURL）
  payment_intent_id: string;
  amount: number;
  currency: string;
  description: string;
  expires_at: string;
}

class StripeService {
  private isInitialized = false;
  private publishableKey = '';

  // Django APIから決済Intent作成
  async createPaymentIntent(paymentData: PaymentRequest): Promise<ApiResponse<PaymentIntentResponse>> {
    try {
      const response = await apiClient.post<PaymentIntentResponse>(
        '/payments/create-intent/',
        {
          amount: paymentData.amount,
          currency: paymentData.currency || 'jpy',
          booking_id: paymentData.booking_id,
          booking_type: paymentData.booking_type,
          payment_method_types: ['card'],
          automatic_payment_methods: {
            enabled: true,
          },
        }
      );
      
      if (response.success && response.data) {
        this.publishableKey = response.data.publishableKey;
        return response;
      }
      
      return {
        success: false,
        error: 'Failed to create payment intent',
      };
    } catch (error) {
      console.error('Payment intent creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment intent creation failed',
      };
    }
  }

  // Payment Sheet初期化
  async initializePaymentSheet(paymentIntentData: PaymentIntentResponse): Promise<boolean> {
    try {
      const {error} = await initPaymentSheet({
        merchantDisplayName: 'BiidTaxi',
        paymentIntentClientSecret: paymentIntentData.clientSecret,
        customerId: paymentIntentData.customerId,
        customerEphemeralKeySecret: paymentIntentData.ephemeralKey,
        allowsDelayedPaymentMethods: true,
        defaultBillingDetails: {
          name: 'BiidTaxi User',
        },
        returnURL: 'biidtaxi://payment-complete',
        appearance: {
          primaryButton: {
            colors: {
              background: '#007AFF',
            },
          },
        },
      });

      if (error) {
        console.error('Payment sheet initialization failed:', error);
        return false;
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Payment sheet initialization error:', error);
      return false;
    }
  }

  // 決済実行
  async presentPaymentSheet(): Promise<PaymentResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Payment sheet not initialized',
      };
    }

    try {
      const {error} = await presentPaymentSheet();

      if (error) {
        console.error('Payment failed:', error);
        return {
          success: false,
          error: this.mapPaymentSheetErrorToMessage(error),
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('Payment presentation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed',
      };
    }
  }

  // プラットフォーム決済（Apple Pay / Google Pay）の確認
  async checkPlatformPaySupport(): Promise<boolean> {
    try {
      const isSupported = await isPlatformPaySupported({
        googlePay: {
          testEnv: __DEV__,
          merchantName: 'BiidTaxi',
          countryCode: 'JP',
          billingAddressConfig: {
            format: 'FULL',
            isPhoneNumberRequired: true,
            isRequired: false,
          },
          existingPaymentMethodRequired: false,
        },
        applePay: {
          merchantId: 'merchant.com.biidtaxi.app',
        },
      });
      
      return isSupported;
    } catch (error) {
      console.error('Platform pay support check failed:', error);
      return false;
    }
  }

  // プラットフォーム決済実行
  async processPlatformPay(paymentIntentData: PaymentIntentResponse, amount: number): Promise<PaymentResult> {
    try {
      const isSupported = await this.checkPlatformPaySupport();
      if (!isSupported) {
        return {
          success: false,
          error: 'Platform pay not supported',
        };
      }

      const {error} = await confirmPlatformPayPayment(
        paymentIntentData.clientSecret,
        {
          googlePay: {
            testEnv: __DEV__,
            merchantName: 'BiidTaxi',
            countryCode: 'JP',
            billingAddressConfig: {
              format: 'FULL',
              isPhoneNumberRequired: true,
              isRequired: false,
            },
            existingPaymentMethodRequired: false,
          },
          applePay: {
            cartItems: [
              {
                label: 'BiidTaxi料金',
                amount: amount.toString(),
                type: 'final',
              },
            ],
            merchantCountryCode: 'JP',
            currencyCode: 'JPY',
            requiredShippingAddressFields: [],
            requiredBillingContactFields: [],
          },
        }
      );

      if (error) {
        console.error('Platform pay failed:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('Platform pay error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Platform pay failed',
      };
    }
  }

  // 決済完了確認（Django APIへ）
  async confirmPayment(bookingId: string, bookingType: 'taxi' | 'ship'): Promise<ApiResponse<{status: string}>> {
    try {
      return await apiClient.post(`/payments/confirm/`, {
        booking_id: bookingId,
        booking_type: bookingType,
      });
    } catch (error) {
      console.error('Payment confirmation failed:', error);
      return {
        success: false,
        error: 'Payment confirmation failed',
      };
    }
  }

  // 決済履歴取得
  async getPaymentHistory(limit = 20, offset = 0): Promise<ApiResponse<any[]>> {
    try {
      return await apiClient.get(`/payments/history/?limit=${limit}&offset=${offset}`);
    } catch (error) {
      console.error('Payment history fetch failed:', error);
      return {
        success: false,
        error: 'Failed to fetch payment history',
      };
    }
  }

  // 返金処理
  async requestRefund(paymentId: string, amount?: number, reason?: string): Promise<ApiResponse<{refund_id: string}>> {
    try {
      return await apiClient.post(`/payments/refund/`, {
        payment_id: paymentId,
        amount,
        reason,
      });
    } catch (error) {
      console.error('Refund request failed:', error);
      return {
        success: false,
        error: 'Refund request failed',
      };
    }
  }

  // 保存済み決済手段取得
  async getSavedPaymentMethods(): Promise<ApiResponse<any[]>> {
    try {
      return await apiClient.get('/payments/methods/');
    } catch (error) {
      console.error('Failed to get payment methods:', error);
      return {
        success: false,
        error: 'Failed to get payment methods',
      };
    }
  }

  // 決済手段削除
  async deletePaymentMethod(paymentMethodId: string): Promise<ApiResponse<{status: string}>> {
    try {
      return await apiClient.delete(`/payments/methods/${paymentMethodId}/`);
    } catch (error) {
      console.error('Failed to delete payment method:', error);
      return {
        success: false,
        error: 'Failed to delete payment method',
      };
    }
  }

  // エラーメッセージマッピング
  private mapPaymentSheetErrorToMessage(error: PaymentSheetError): string {
    switch (error.code) {
      case 'Canceled':
        return 'お支払いがキャンセルされました';
      case 'Failed':
        return 'お支払いが失敗しました。カード情報をご確認ください';
      case 'Timeout':
        return 'タイムアウトしました。もう一度お試しください';
      default:
        return error.message || 'お支払いでエラーが発生しました';
    }
  }

  // QR決済Intent作成
  async createQRPaymentIntent(qrPaymentData: {
    payment_intent_id: string;
    amount: number;
    currency: string;
    description: string;
    booking_id?: string;
    booking_type?: 'taxi' | 'ship';
  }): Promise<ApiResponse<QRPaymentIntent>> {
    try {
      const response = await apiClient.post<QRPaymentIntent>(
        '/payments/qr/create-intent/',
        {
          payment_intent_id: qrPaymentData.payment_intent_id,
          amount: qrPaymentData.amount,
          currency: qrPaymentData.currency || 'jpy',
          description: qrPaymentData.description,
          booking_id: qrPaymentData.booking_id,
          booking_type: qrPaymentData.booking_type,
        }
      );
      
      return response;
    } catch (error) {
      console.error('QR payment intent creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'QR payment intent creation failed',
      };
    }
  }

  // QR決済処理
  async processQRPayment(qrPaymentData: {
    payment_intent_id: string;
    amount: number;
    currency: string;
    description: string;
    booking_id?: string;
    booking_type?: 'taxi' | 'ship';
  }): Promise<PaymentResult> {
    try {
      // QR決済確認API呼び出し
      const response = await apiClient.post(
        '/payments/qr/process/',
        {
          payment_intent_id: qrPaymentData.payment_intent_id,
          amount: qrPaymentData.amount,
          currency: qrPaymentData.currency,
          description: qrPaymentData.description,
          booking_id: qrPaymentData.booking_id,
          booking_type: qrPaymentData.booking_type,
        }
      );

      if (response.success) {
        // 決済確認
        if (qrPaymentData.booking_id && qrPaymentData.booking_type) {
          const confirmResult = await this.confirmPayment(
            qrPaymentData.booking_id,
            qrPaymentData.booking_type
          );
          
          if (!confirmResult.success) {
            return {
              success: false,
              error: 'Payment confirmation failed',
            };
          }
        }
        
        return {
          success: true,
          paymentId: qrPaymentData.payment_intent_id,
        };
      }
      
      return {
        success: false,
        error: response.error || 'QR payment processing failed',
      };
    } catch (error) {
      console.error('QR payment processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'QR payment processing failed',
      };
    }
  }

  // 完全な決済フロー（便利メソッド）
  async processPayment(paymentData: PaymentRequest): Promise<PaymentResult> {
    try {
      // 1. Payment Intent作成
      const intentResponse = await this.createPaymentIntent(paymentData);
      if (!intentResponse.success || !intentResponse.data) {
        return {
          success: false,
          error: intentResponse.error || 'Payment intent creation failed',
        };
      }

      // 2. Payment Sheet初期化
      const initSuccess = await this.initializePaymentSheet(intentResponse.data);
      if (!initSuccess) {
        return {
          success: false,
          error: 'Payment sheet initialization failed',
        };
      }

      // 3. 決済実行
      const paymentResult = await this.presentPaymentSheet();
      if (!paymentResult.success) {
        return paymentResult;
      }

      // 4. 決済確認
      const confirmResult = await this.confirmPayment(paymentData.booking_id, paymentData.booking_type);
      if (!confirmResult.success) {
        return {
          success: false,
          error: 'Payment confirmation failed',
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('Complete payment process failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment process failed',
      };
    }
  }
}

export const stripeService = new StripeService();