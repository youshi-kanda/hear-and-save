import messaging, {FirebaseMessagingTypes} from '@react-native-firebase/messaging';
import {Alert, Platform, PermissionsAndroid} from 'react-native';
import {apiClient} from '../api/client';
import {ApiResponse} from '../api/types';

export interface NotificationData {
  title: string;
  body: string;
  type: 'ride_update' | 'payment' | 'general' | 'emergency';
  data?: {
    ride_id?: string;
    booking_id?: string;
    action?: string;
    screen?: string;
    [key: string]: any;
  };
}

class NotificationService {
  private fcmToken: string | null = null;
  private unsubscribeOnMessage: (() => void) | null = null;
  private unsubscribeOnNotificationOpen: (() => void) | null = null;

  // Firebase初期化と権限要求
  async initialize(): Promise<boolean> {
    // 開発環境でのFirebase初期化をスキップ（Mock対応）
    if (__DEV__) {
      console.log('🎭 Mock mode: Skipping Firebase FCM initialization');
      this.fcmToken = 'mock-fcm-token-12345';
      return true;
    }
    
    try {
      // 権限確認・要求
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.warn('Notification permission denied');
        return false;
      }

      // FCMトークン取得
      const token = await this.getFCMToken();
      if (!token) {
        console.error('Failed to get FCM token');
        return false;
      }

      this.fcmToken = token;

      // Django APIにトークン送信
      await this.registerTokenWithServer(token);

      // メッセージリスナー設定
      this.setupMessageListeners();

      // トークン更新リスナー
      this.setupTokenRefreshListener();

      console.log('Notification service initialized successfully');
      return true;
    } catch (error) {
      console.error('Notification service initialization failed:', error);
      return false;
    }
  }

  // 通知権限の確認・要求
  private async requestPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          return false;
        }
      }

      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        Alert.alert(
          '通知の許可',
          '配車状況や重要な情報をお知らせするために、通知を許可してください。',
          [
            {text: '後で', style: 'cancel'},
            {
              text: '設定を開く',
              onPress: () => {
                // TODO: 設定画面を開く
                console.log('Open notification settings');
              },
            },
          ]
        );
      }

      return enabled;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  // FCMトークン取得
  private async getFCMToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      console.log('FCM Token:', token);
      return token;
    } catch (error) {
      console.error('FCM token acquisition failed:', error);
      return null;
    }
  }

  // Django APIにトークン登録
  private async registerTokenWithServer(token: string): Promise<void> {
    try {
      await apiClient.post('/notifications/register-token/', {
        fcm_token: token,
        platform: Platform.OS,
        app_version: '1.0.0', // TODO: 実際のバージョンを取得
      });
      console.log('FCM token registered with server');
    } catch (error) {
      console.error('Failed to register FCM token with server:', error);
    }
  }

  // メッセージリスナー設定
  private setupMessageListeners(): void {
    // フォアグラウンド通知
    this.unsubscribeOnMessage = messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground message received:', remoteMessage);
      
      if (remoteMessage.notification) {
        Alert.alert(
          remoteMessage.notification.title || '通知',
          remoteMessage.notification.body || '',
          [
            {text: 'OK', onPress: () => this.handleNotificationPress(remoteMessage)},
          ]
        );
      }
    });

    // 通知タップ処理（アプリがバックグラウンドから開かれた場合）
    this.unsubscribeOnNotificationOpen = messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification opened app from background:', remoteMessage);
      this.handleNotificationPress(remoteMessage);
    });

    // アプリが終了状態から通知で開かれた場合
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('App opened from quit state by notification:', remoteMessage);
          this.handleNotificationPress(remoteMessage);
        }
      });
  }

  // トークン更新リスナー
  private setupTokenRefreshListener(): void {
    messaging().onTokenRefresh((token) => {
      console.log('FCM token refreshed:', token);
      this.fcmToken = token;
      this.registerTokenWithServer(token);
    });
  }

  // 通知タップ処理
  private handleNotificationPress(remoteMessage: FirebaseMessagingTypes.RemoteMessage): void {
    const data = remoteMessage.data;
    
    if (!data) {
      return;
    }

    // 通知タイプに応じた画面遷移
    switch (data.type) {
      case 'ride_update':
        if (data.ride_id) {
          // TODO: ナビゲーションサービスを使って適切な画面に遷移
          console.log('Navigate to ride tracking:', data.ride_id);
        }
        break;
        
      case 'payment':
        if (data.booking_id) {
          console.log('Navigate to payment screen:', data.booking_id);
        }
        break;
        
      case 'emergency':
        Alert.alert(
          '緊急通知',
          remoteMessage.notification?.body || '緊急事態が発生しました。',
          [{text: 'OK'}]
        );
        break;
        
      default:
        console.log('Unknown notification type:', data.type);
    }
  }

  // 通知履歴取得
  async getNotificationHistory(limit = 20, offset = 0): Promise<ApiResponse<any[]>> {
    try {
      return await apiClient.get(`/notifications/history/?limit=${limit}&offset=${offset}`);
    } catch (error) {
      console.error('Failed to get notification history:', error);
      return {
        success: false,
        error: 'Failed to get notification history',
      };
    }
  }

  // 通知設定取得
  async getNotificationSettings(): Promise<ApiResponse<{
    ride_updates: boolean;
    payment_notifications: boolean;
    marketing: boolean;
    emergency: boolean;
  }>> {
    try {
      return await apiClient.get('/notifications/settings/');
    } catch (error) {
      console.error('Failed to get notification settings:', error);
      return {
        success: false,
        error: 'Failed to get notification settings',
      };
    }
  }

  // 通知設定更新
  async updateNotificationSettings(settings: {
    ride_updates?: boolean;
    payment_notifications?: boolean;
    marketing?: boolean;
    emergency?: boolean;
  }): Promise<ApiResponse<any>> {
    try {
      return await apiClient.put('/notifications/settings/', settings);
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      return {
        success: false,
        error: 'Failed to update notification settings',
      };
    }
  }

  // 特定通知を既読にマーク
  async markAsRead(notificationId: string): Promise<ApiResponse<any>> {
    try {
      return await apiClient.post(`/notifications/${notificationId}/read/`);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return {
        success: false,
        error: 'Failed to mark notification as read',
      };
    }
  }

  // 全通知を既読にマーク
  async markAllAsRead(): Promise<ApiResponse<any>> {
    try {
      return await apiClient.post('/notifications/mark-all-read/');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      return {
        success: false,
        error: 'Failed to mark all notifications as read',
      };
    }
  }

  // 通知トークン削除（ログアウト時）
  async unregisterToken(): Promise<void> {
    try {
      if (this.fcmToken) {
        await apiClient.delete('/notifications/unregister-token/', {
          fcm_token: this.fcmToken,
        });
      }
    } catch (error) {
      console.error('Failed to unregister token:', error);
    }
  }

  // サービス停止
  destroy(): void {
    if (this.unsubscribeOnMessage) {
      this.unsubscribeOnMessage();
      this.unsubscribeOnMessage = null;
    }
    
    if (this.unsubscribeOnNotificationOpen) {
      this.unsubscribeOnNotificationOpen();
      this.unsubscribeOnNotificationOpen = null;
    }
  }

  // 現在のFCMトークンを取得
  getCurrentToken(): string | null {
    return this.fcmToken;
  }

  // テスト用通知送信（開発時のみ）
  async sendTestNotification(): Promise<void> {
    if (__DEV__ && this.fcmToken) {
      try {
        await apiClient.post('/notifications/send-test/', {
          fcm_token: this.fcmToken,
          title: 'テスト通知',
          body: 'BiidTaxiからのテスト通知です',
        });
        console.log('Test notification sent');
      } catch (error) {
        console.error('Failed to send test notification:', error);
      }
    }
  }
}

export const notificationService = new NotificationService();