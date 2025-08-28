import {apiClient} from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  TaxiBooking,
  TaxiBookingRequest,
  Driver,
  Location,
  PaymentMethod,
  ApiResponse,
} from './types';

const CURRENT_RIDE_ID_KEY = 'current_taxi_ride_id';

export class TaxiService {
  private currentRideId: string | null = null;
  private rideStatusCache: Map<string, { status: string; lastChecked: number }> = new Map();

  // Ride IDの永続化と管理
  async setCurrentRideId(rideId: string | null) {
    this.currentRideId = rideId;
    try {
      if (rideId) {
        await AsyncStorage.setItem(CURRENT_RIDE_ID_KEY, rideId);
        console.log(`Current ride ID saved to storage: ${rideId}`);
      } else {
        await AsyncStorage.removeItem(CURRENT_RIDE_ID_KEY);
        console.log('Current ride ID removed from storage');
      }
    } catch (error) {
      console.warn('Failed to save current ride ID to storage:', error);
    }
  }

  async getCurrentRideId(): Promise<string | null> {
    if (this.currentRideId) {
      return this.currentRideId;
    }
    
    try {
      const storedRideId = await AsyncStorage.getItem(CURRENT_RIDE_ID_KEY);
      if (storedRideId) {
        this.currentRideId = storedRideId;
        console.log(`Current ride ID loaded from storage: ${storedRideId}`);
        return storedRideId;
      }
    } catch (error) {
      console.warn('Failed to load current ride ID from storage:', error);
    }
    
    return null;
  }

  // ストレージから現在のRide IDを復元
  async initializeFromStorage(): Promise<void> {
    await this.getCurrentRideId(); // これでストレージから読み込み
  }

  // Django形式のタクシー予約作成
  async createRide(bookingData: TaxiBookingRequest): Promise<ApiResponse<TaxiBooking>> {
    try {
      const response = await apiClient.post<TaxiBooking>('/taxi/api/rides/', bookingData);
      
      // 成功時に現在のRide IDを設定
      if (response.success && response.data) {
        await this.setCurrentRideId(response.data.id);
      }
      
      return response;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create taxi booking',
      };
    }
  }

  // Django形式のライド詳細取得
  async getRide(rideId: string): Promise<ApiResponse<TaxiBooking>> {
    try {
      return await apiClient.get<TaxiBooking>(`/taxi/api/rides/${rideId}/`);
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get booking details',
      };
    }
  }

  // Django形式のライド一覧取得
  async getRides(page = 1, page_size = 20): Promise<ApiResponse<TaxiBooking[]>> {
    try {
      return await apiClient.get<TaxiBooking[]>(
        `/taxi/api/rides/?page=${page}&page_size=${page_size}`
      );
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get bookings',
      };
    }
  }

  // リアルタイムステータス取得 (/taxi/api/rides/<uuid>/realtime-status/)
  async getRideRealtimeStatus(rideId: string): Promise<ApiResponse<{
    id: string;
    status: string;
    driver_location?: { latitude: number; longitude: number };
    eta?: number;
    is_active: boolean;
    is_completed: boolean;
    last_updated: string;
  }>> {
    try {
      console.log(`Getting realtime status for ride: ${rideId}`);
      
      const response = await apiClient.get(`/taxi/api/rides/${rideId}/realtime-status/`);
      
      // ステータスキャッシュ更新
      if (response.success && response.data) {
        this.rideStatusCache.set(rideId, {
          status: response.data.status,
          lastChecked: Date.now(),
        });
      }
      
      return response;
    } catch (error) {
      console.error(`Failed to get realtime status for ride ${rideId}:`, error);
      return {
        success: false,
        error: 'Failed to get ride realtime status',
      };
    }
  }

  // キャッシュされたステータスを取得
  getCachedRideStatus(rideId: string): { status: string; lastChecked: number } | null {
    const cached = this.rideStatusCache.get(rideId);
    if (cached && (Date.now() - cached.lastChecked) < 30000) { // 30秒以内
      return cached;
    }
    return null;
  }

  // Rideが有効かつアクティブか確認
  async isRideValid(rideId: string): Promise<{ valid: boolean; reason?: string; newRideNeeded?: boolean }> {
    try {
      console.log(`Validating ride: ${rideId}`);
      
      // まずRideのリアルタイムステータスを取得
      const statusResponse = await this.getRideRealtimeStatus(rideId);
      
      if (!statusResponse.success) {
        if (statusResponse.error?.includes('ride_not_found')) {
          return {
            valid: false,
            reason: 'ride_not_found',
            newRideNeeded: true,
          };
        }
        return {
          valid: false,
          reason: 'status_check_failed',
        };
      }
      
      const rideData = statusResponse.data!;
      
      // 終了済みまたは非アクティブの場合
      if (rideData.is_completed || !rideData.is_active) {
        return {
          valid: false,
          reason: 'ride_completed_or_inactive',
          newRideNeeded: true,
        };
      }
      
      // 終了ステータスの確認
      const completedStatuses = ['completed', 'cancelled', 'expired', 'failed'];
      if (completedStatuses.includes(rideData.status.toLowerCase())) {
        return {
          valid: false,
          reason: `ride_status_${rideData.status}`,
          newRideNeeded: true,
        };
      }
      
      return {
        valid: true,
      };
      
    } catch (error) {
      console.error('Ride validation error:', error);
      return {
        valid: false,
        reason: 'validation_error',
      };
    }
  }

  // 新しいQuick Rideを初期化 (/taxi/api/quick-rides/init/)
  async initializeQuickRide(params: {
    pickup_location: { latitude: number; longitude: number; address?: string };
    destination_location?: { latitude: number; longitude: number; address?: string };
    vehicle_type?: string;
    passenger_count?: number;
  }): Promise<ApiResponse<{
    ride_id: string;
    status: string;
    estimated_fare?: number;
    eta?: number;
  }>> {
    try {
      console.log('Initializing new quick ride:', params);
      
      const response = await apiClient.post('/taxi/api/quick-rides/init/', {
        pickup_location: params.pickup_location,
        destination_location: params.destination_location,
        vehicle_type: params.vehicle_type || 'standard',
        passenger_count: params.passenger_count || 1,
      });
      
      // 成功時に新しいRide IDを設定
      if (response.success && response.data) {
        await this.setCurrentRideId(response.data.ride_id);
        console.log(`New ride initialized: ${response.data.ride_id}`);
      }
      
      return response;
    } catch (error) {
      console.error('Failed to initialize quick ride:', error);
      return {
        success: false,
        error: 'Failed to initialize quick ride',
      };
    }
  }

  // Ride IDの有効性を確認し、必要に応じて新しいRideを作成
  async ensureValidRideId(params?: {
    pickup_location: { latitude: number; longitude: number; address?: string };
    destination_location?: { latitude: number; longitude: number; address?: string };
    vehicle_type?: string;
  }): Promise<{ rideId: string | null; isNew: boolean; error?: string }> {
    try {
      console.log('Ensuring valid ride ID...');
      
      const currentRideId = await this.getCurrentRideId();
      
      // 現在のRide IDがない場合、新しいRideを作成
      if (!currentRideId) {
        if (!params || !params.pickup_location) {
          return {
            rideId: null,
            isNew: false,
            error: 'No current ride and insufficient params for new ride',
          };
        }
        
        const newRideResponse = await this.initializeQuickRide(params);
        if (newRideResponse.success && newRideResponse.data) {
          return {
            rideId: newRideResponse.data.ride_id,
            isNew: true,
          };
        } else {
          return {
            rideId: null,
            isNew: false,
            error: newRideResponse.error || 'Failed to create new ride',
          };
        }
      }
      
      // 現在のRide IDが有効か確認
      const validation = await this.isRideValid(currentRideId);
      
      if (validation.valid) {
        return {
          rideId: currentRideId,
          isNew: false,
        };
      }
      
      // Rideが無効で、新しいRideが必要な場合
      if (validation.newRideNeeded && params && params.pickup_location) {
        console.log(`Current ride ${currentRideId} is invalid (${validation.reason}), creating new ride...`);
        
        const newRideResponse = await this.initializeQuickRide(params);
        if (newRideResponse.success && newRideResponse.data) {
          return {
            rideId: newRideResponse.data.ride_id,
            isNew: true,
          };
        }
      }
      
      return {
        rideId: null,
        isNew: false,
        error: `Ride validation failed: ${validation.reason}`,
      };
      
    } catch (error) {
      console.error('Error ensuring valid ride ID:', error);
      return {
        rideId: null,
        isNew: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Django形式のライドキャンセル
  async cancelRide(rideId: string, reason?: string): Promise<ApiResponse<TaxiBooking>> {
    try {
      const response = await apiClient.patch<TaxiBooking>(`/taxi/api/rides/${rideId}/cancel/`, {
        reason,
      });
      
      // キャンセル成功時は現在のRide IDをクリア
      if (response.success) {
        await this.setCurrentRideId(null);
        this.rideStatusCache.delete(rideId);
      }
      
      return response;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to cancel booking',
      };
    }
  }

  // Django形式の料金見積もり
  async getFareEstimate(
    pickup: Location,
    destination?: Location,
    vehicle_type: string = 'standard'
  ): Promise<ApiResponse<{fare: number; distance: number; duration: number}>> {
    try {
      return await apiClient.post('/taxi/api/estimate/', {
        pickup,
        destination,
        vehicle_type,
      });
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get fare estimate',
      };
    }
  }

  // Django形式の近くのドライバー検索
  async findNearbyDrivers(
    location: Location,
    vehicle_type: string = 'standard',
    radius = 5000
  ): Promise<ApiResponse<Driver[]>> {
    try {
      return await apiClient.post('/taxi/api/drivers/nearby/', {
        location,
        vehicle_type,
        radius,
      });
    } catch (error) {
      return {
        success: false,
        error: 'Failed to find nearby drivers',
      };
    }
  }

  // Django形式のドライバー位置追跡
  async getDriverLocation(rideId: string): Promise<ApiResponse<Location>> {
    try {
      return await apiClient.get<Location>(`/taxi/api/rides/${rideId}/driver/location/`);
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get driver location',
      };
    }
  }

  // Django形式のライド状況更新を取得
  async getRideStatus(rideId: string): Promise<ApiResponse<TaxiBooking>> {
    try {
      return await apiClient.get<TaxiBooking>(`/taxi/api/rides/${rideId}/status/`);
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get booking updates',
      };
    }
  }

  // Django形式の車両タイプ一覧取得
  async getVehicleTypes(): Promise<ApiResponse<{
    id: string;
    name: string;
    description: string;
    base_rate: number;
    per_km_rate: number;
    per_minute_rate: number;
  }[]>> {
    try {
      return await apiClient.get('/taxi/api/vehicle-types/');
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get vehicle types',
      };
    }
  }

  // Django形式の住所検索（ジオコーディング）
  async searchAddress(query: string): Promise<ApiResponse<Location[]>> {
    try {
      return await apiClient.get<Location[]>(`/taxi/api/geocoding/search/?q=${encodeURIComponent(query)}`);
    } catch (error) {
      return {
        success: false,
        error: 'Failed to search address',
      };
    }
  }

  // Django形式のジオコーディング（住所から座標）
  async geocode(address: string): Promise<ApiResponse<{latitude: number; longitude: number; address: string}>> {
    try {
      return await apiClient.get(`/taxi/api/geocoding/forward/?address=${encodeURIComponent(address)}`);
    } catch (error) {
      return {
        success: false,
        error: 'Failed to geocode address',
      };
    }
  }

  // OpenStreetMap Nominatim APIを使用したジオコーディング（フォールバック用）
  async geocodeWithNominatim(address: string): Promise<ApiResponse<{latitude: number; longitude: number; address: string}>> {
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1&accept-language=ja`;
      
      const response = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'BiidTaxiApp/1.0.0',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        if (result.lat && result.lon) {
          const address_parts = result.address;
          let formattedAddress = result.display_name;
          
          if (address_parts) {
            const parts = [];
            
            if (address_parts.state || address_parts.prefecture) {
              parts.push(address_parts.state || address_parts.prefecture);
            }
            
            if (address_parts.city || address_parts.town || address_parts.village) {
              parts.push(address_parts.city || address_parts.town || address_parts.village);
            }
            
            if (address_parts.city_district) {
              parts.push(address_parts.city_district);
            }
            
            if (address_parts.house_number && address_parts.road) {
              parts.push(`${address_parts.road}${address_parts.house_number}`);
            } else if (address_parts.road) {
              parts.push(address_parts.road);
            }
            
            if (parts.length > 0) {
              formattedAddress = parts.join('');
            }
          }

          return {
            success: true,
            data: {
              latitude: parseFloat(result.lat),
              longitude: parseFloat(result.lon),
              address: formattedAddress,
            }
          };
        }
      }

      return {
        success: false,
        error: 'Address not found',
      };
      
    } catch (error) {
      return {
        success: false,
        error: 'Failed to geocode with Nominatim',
      };
    }
  }

  // Django形式の逆ジオコーディング（座標から住所）
  async reverseGeocode(latitude: number, longitude: number): Promise<ApiResponse<Location>> {
    try {
      return await apiClient.get<Location>(
        `/taxi/api/geocoding/reverse/?lat=${latitude}&lng=${longitude}`
      );
    } catch (error) {
      return {
        success: false,
        error: 'Failed to reverse geocode',
      };
    }
  }

  // OpenStreetMap Nominatim APIを使用した逆ジオコーディング（フォールバック用）
  async reverseGeocodeWithNominatim(latitude: number, longitude: number): Promise<ApiResponse<{address: string}>> {
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=ja`;
      
      const response = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'BiidTaxiApp/1.0.0',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.display_name) {
        const address = data.address;
        if (address) {
          const parts = [];
          
          if (address.state || address.prefecture) {
            parts.push(address.state || address.prefecture);
          }
          
          if (address.city || address.town || address.village) {
            parts.push(address.city || address.town || address.village);
          }
          
          if (address.city_district) {
            parts.push(address.city_district);
          }
          
          if (address.house_number && address.road) {
            parts.push(`${address.road}${address.house_number}`);
          } else if (address.road) {
            parts.push(address.road);
          }
          
          const formattedAddress = parts.length > 0 ? parts.join('') : data.display_name;
          
          return {
            success: true,
            data: {
              address: formattedAddress
            }
          };
        }
      }

      return {
        success: false,
        error: 'Address not found',
      };
      
    } catch (error) {
      return {
        success: false,
        error: 'Failed to reverse geocode with Nominatim',
      };
    }
  }

  // Django形式のルート情報取得
  async getRoute(
    pickup: Location,
    destination: Location
  ): Promise<ApiResponse<{
    distance: number;
    duration: number;
    polyline: string;
    steps: any[];
  }>> {
    try {
      return await apiClient.post('/taxi/api/routing/', {
        pickup,
        destination,
      });
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get route',
      };
    }
  }

  // Django形式の支払い方法一覧
  async getPaymentMethods(): Promise<ApiResponse<PaymentMethod[]>> {
    try {
      return await apiClient.get<PaymentMethod[]>('/taxi/api/payment-methods/');
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get payment methods',
      };
    }
  }

  // Django形式の決済実行
  async processPayment(
    rideId: string,
    payment_method_id: string
  ): Promise<ApiResponse<{transaction_id: string; status: string}>> {
    try {
      return await apiClient.post(`/taxi/api/rides/${rideId}/payment/`, {
        payment_method_id,
      });
    } catch (error) {
      return {
        success: false,
        error: 'Payment processing failed',
      };
    }
  }

  // Django形式のレビュー送信
  async submitReview(
    rideId: string,
    rating: number,
    comment?: string
  ): Promise<ApiResponse<void>> {
    try {
      return await apiClient.post(`/taxi/api/rides/${rideId}/review/`, {
        rating,
        comment,
      });
    } catch (error) {
      return {
        success: false,
        error: 'Failed to submit review',
      };
    }
  }

  // Django形式の緊急事態報告
  async reportEmergency(
    rideId: string,
    emergency_type: string,
    location?: Location
  ): Promise<ApiResponse<{emergency_id: string}>> {
    try {
      return await apiClient.post('/taxi/api/emergency/', {
        ride_id: rideId,
        emergency_type,
        location,
      });
    } catch (error) {
      return {
        success: false,
        error: 'Failed to report emergency',
      };
    }
  }

  // 予約履歴取得
  async getBookingHistory(limit = 20, offset = 0): Promise<ApiResponse<any[]>> {
    try {
      return await apiClient.get(`/taxi/api/rides/history/?limit=${limit}&offset=${offset}`);
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get booking history',
      };
    }
  }

  // ライド評価
  async rateRide(rideId: string, rating: number, review: string): Promise<ApiResponse<any>> {
    try {
      return await apiClient.post(`/taxi/api/rides/${rideId}/rate/`, {
        rating,
        review,
      });
    } catch (error) {
      return {
        success: false,
        error: 'Failed to rate ride',
      };
    }
  }
}

export const taxiService = new TaxiService();