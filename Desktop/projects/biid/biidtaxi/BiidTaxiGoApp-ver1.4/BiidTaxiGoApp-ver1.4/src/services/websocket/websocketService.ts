import {WebSocketMessage, TaxiTrackingUpdate} from '../api/types';

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting';

export interface LocationUpdate {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
  timestamp: string;
}

export interface RideStatusUpdate {
  ride_id: string;
  status: 'pending' | 'driver_assigned' | 'driver_en_route' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';
  driver_location?: LocationUpdate;
  estimated_arrival?: string;
  estimated_duration?: number;
  fare_update?: {
    current_fare: number;
    reason: string;
  };
  message?: string;
}

export interface DriverInfo {
  driver_id: string;
  name: string;
  phone?: string;
  rating: number;
  vehicle_info: {
    model: string;
    plate_number: string;
    color?: string;
  };
  photo_url?: string;
}

export interface ShipStatusUpdate {
  booking_id: string;
  schedule_id: string;
  status: 'scheduled' | 'boarding' | 'departed' | 'in_transit' | 'arrived' | 'completed' | 'cancelled' | 'delayed';
  vessel_location?: LocationUpdate;
  estimated_arrival?: string;
  delay_info?: {
    delay_minutes: number;
    reason: string;
  };
  weather_alert?: {
    severity: 'low' | 'medium' | 'high';
    message: string;
  };
}

interface WebSocketEventHandlers {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onReconnecting?: () => void;
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: Event) => void;
  onTaxiUpdate?: (update: TaxiTrackingUpdate) => void;
  onShipUpdate?: (update: ShipStatusUpdate) => void;
  onNotification?: (notification: any) => void;
  onRideStatusUpdate?: (update: RideStatusUpdate) => void;
  onDriverAssigned?: (driverInfo: DriverInfo, rideId: string) => void;
  onLocationUpdate?: (location: LocationUpdate, entityId: string) => void;
  onFareUpdate?: (fare: number, reason: string, rideId: string) => void;
  onEmergencyAlert?: (alert: any) => void;
  onSystemMessage?: (message: string, type: 'info' | 'warning' | 'error') => void;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private handlers: WebSocketEventHandlers = {};
  private connectionState: ConnectionState = 'disconnected';
  private reconnectInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000; // 初期再接続間隔（ミリ秒）
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private authToken: string | null = null;
  private currentRideId: string | null = null;
  private locationUpdateInterval: NodeJS.Timeout | null = null;
  private statusSyncInterval: NodeJS.Timeout | null = null;
  private messageQueue: any[] = [];
  private isReconnecting = false;

  constructor() {
    this.url = __DEV__ 
      ? 'ws://192.168.1.100:8000'  // 実機テスト用（PCのローカルIP）
      : 'wss://taxiboat.hokkomarina.com';  // Django本番環境
  }

  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  setEventHandlers(handlers: WebSocketEventHandlers) {
    this.handlers = {...this.handlers, ...handlers};
  }

  // Django WebSocket用の接続メソッド
  connect(rideId?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // 開発環境でのWebSocket接続をスキップ
      if (__DEV__) {
        console.log('🎭 Mock mode: Skipping WebSocket connection to Django backend');
        this.connectionState = 'connected'; // Mock状態を設定
        resolve();
        return;
      }
      
      if (this.ws && this.connectionState === 'connected') {
        resolve();
        return;
      }

      this.connectionState = 'connecting';

      try {
        // Django WebSocket URL形式: /ws/ride/{ride_id}/
        let wsUrl = this.url;
        if (rideId) {
          wsUrl += `/ws/ride/${rideId}/`;
        } else {
          // 一般的な通知用WebSocket
          wsUrl += '/ws/notifications/';
        }

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('Django WebSocket connected to:', wsUrl);
          this.connectionState = 'connected';
          this.reconnectAttempts = 0;
          
          // Django WebSocket認証
          if (this.authToken) {
            this.send({
              type: 'authenticate',
              token: this.authToken,
            });
          }
          
          // ハートビート開始
          this.startHeartbeat();
          
          this.handlers.onConnect?.();
          resolve();
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.connectionState = 'disconnected';
          this.stopHeartbeat();
          this.stopLocationUpdates();
          this.stopStatusSync();
          
          this.handlers.onDisconnect?.();

          // 自動再接続（正常なクローズでない場合）
          if (event.code !== 1000 && !this.isReconnecting && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.connectionState = 'error';
          this.handlers.onError?.(error);
          reject(error);
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            console.log('WebSocket message received:', message);
            
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        this.connectionState = 'error';
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = null;
    }

    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }

    this.connectionState = 'disconnected';
  }

  send(message: any): boolean {
    if (this.ws && this.connectionState === 'connected') {
      try {
        this.ws.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
        return false;
      }
    }
    return false;
  }

  // Django形式のタクシー追跡（ride_id別WebSocket接続で自動追跡）
  subscribeToRideTracking(rideId: string): Promise<void> {
    // Django WebSocketでは ride_id 別の接続が必要
    return this.connect(rideId);
  }

  // タクシー追跡停止（WebSocket切断）
  unsubscribeFromRideTracking(): void {
    this.disconnect();
  }

  // Django形式の船舶追跡
  subscribeToShipTracking(scheduleId: string): Promise<void> {
    return this.connect(`ship_${scheduleId}`);
  }

  // 船舶追跡停止
  unsubscribeFromShipTracking(): void {
    this.disconnect();
  }

  // Django形式の通知購読（一般通知WebSocket）
  subscribeToNotifications(): Promise<void> {
    // 開発環境でのWebSocket接続をスキップ
    if (__DEV__) {
      console.log('🎭 Mock mode: Skipping notification WebSocket connection');
      return Promise.resolve();
    }
    
    return this.connect(); // ride_id指定なしで通知用WebSocketに接続
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  private handleMessage(message: WebSocketMessage) {
    // 全メッセージハンドラ
    this.handlers.onMessage?.(message);

    // Django Consumer形式メッセージの処理
    const messageData = message.message || message.data || message;

    // タイプ別ハンドラ
    switch (message.type) {
      case 'ride_update':
      case 'taxi_update': // 互換性保持
        this.handlers.onTaxiUpdate?.(messageData);
        this.handlers.onRideStatusUpdate?.(messageData);
        break;
      
      case 'driver_location':
        const locationUpdate: LocationUpdate = {
          latitude: messageData.latitude,
          longitude: messageData.longitude,
          heading: messageData.heading,
          speed: messageData.speed,
          accuracy: messageData.accuracy,
          timestamp: messageData.timestamp || new Date().toISOString(),
        };
        
        this.handlers.onLocationUpdate?.(locationUpdate, messageData.driver_id || message.entity_id);
        this.handlers.onTaxiUpdate?.({
          ride_id: message.ride_id,
          driver_location: locationUpdate,
          current_location: locationUpdate,
        });
        break;
      
      case 'ride_status':
        this.handlers.onRideStatusUpdate?.({
          ride_id: message.ride_id,
          status: message.status || messageData.status,
          driver_location: messageData.driver_location,
          estimated_arrival: messageData.estimated_arrival,
          estimated_duration: messageData.estimated_duration,
          message: messageData.message,
        });
        break;
      
      case 'driver_assigned':
        this.handlers.onDriverAssigned?.(messageData.driver_info, message.ride_id);
        break;
      
      case 'fare_update':
        this.handlers.onFareUpdate?.(
          messageData.current_fare,
          messageData.reason,
          message.ride_id
        );
        break;
      
      case 'ship_update':
        this.handlers.onShipUpdate?.(messageData);
        break;
      
      case 'vessel_location':
        const vesselLocationUpdate: LocationUpdate = {
          latitude: messageData.latitude,
          longitude: messageData.longitude,
          heading: messageData.heading,
          speed: messageData.speed,
          timestamp: messageData.timestamp || new Date().toISOString(),
        };
        this.handlers.onLocationUpdate?.(vesselLocationUpdate, messageData.vessel_id || message.entity_id);
        break;
      
      case 'notification':
        this.handlers.onNotification?.(messageData);
        break;
      
      case 'emergency_alert':
        this.handlers.onEmergencyAlert?.(messageData);
        break;
      
      case 'system_message':
        this.handlers.onSystemMessage?.(
          messageData.message,
          messageData.type || 'info'
        );
        break;
      
      case 'pong':
        // ハートビートの応答を処理
        console.log('Heartbeat pong received');
        break;
      
      default:
        console.log('Unhandled Django WebSocket message type:', message.type, messageData);
    }
  }

  private scheduleReconnect() {
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
    }

    this.isReconnecting = true;
    this.connectionState = 'reconnecting';
    this.handlers.onReconnecting?.();

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000); // Max 30s delay

    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);

    this.reconnectInterval = setTimeout(async () => {
      try {
        await this.connect(this.currentRideId);
        this.isReconnecting = false;
        
        // 再接続後、キューに溜まったメッセージを送信
        this.sendQueuedMessages();
      } catch (error) {
        console.error('Reconnection failed:', error);
        this.isReconnecting = false;
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        } else {
          console.error('Max reconnection attempts reached');
          this.connectionState = 'error';
        }
      }
    }, delay);
  }

  // リアルタイム位置更新開始
  startLocationTracking(rideId: string, updateInterval = 5000) {
    this.currentRideId = rideId;
    
    if (this.locationUpdateInterval) {
      clearInterval(this.locationUpdateInterval);
    }

    this.locationUpdateInterval = setInterval(() => {
      if (this.connectionState === 'connected') {
        this.send({
          type: 'request_location_update',
          ride_id: rideId,
          timestamp: new Date().toISOString(),
        });
      }
    }, updateInterval);
  }

  // リアルタイム位置更新停止
  stopLocationUpdates() {
    if (this.locationUpdateInterval) {
      clearInterval(this.locationUpdateInterval);
      this.locationUpdateInterval = null;
    }
  }

  // ステータス同期開始
  startStatusSync(rideId: string, syncInterval = 10000) {
    if (this.statusSyncInterval) {
      clearInterval(this.statusSyncInterval);
    }

    this.statusSyncInterval = setInterval(() => {
      if (this.connectionState === 'connected') {
        this.send({
          type: 'request_status_sync',
          ride_id: rideId,
          timestamp: new Date().toISOString(),
        });
      }
    }, syncInterval);
  }

  // ステータス同期停止
  stopStatusSync() {
    if (this.statusSyncInterval) {
      clearInterval(this.statusSyncInterval);
      this.statusSyncInterval = null;
    }
  }

  // メッセージキューイング（接続断時）
  send(message: any): boolean {
    if (this.ws && this.connectionState === 'connected') {
      try {
        this.ws.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
        this.queueMessage(message);
        return false;
      }
    } else {
      this.queueMessage(message);
      return false;
    }
  }

  // メッセージをキューに追加
  private queueMessage(message: any) {
    if (this.messageQueue.length >= 100) {
      this.messageQueue.shift(); // 古いメッセージを削除
    }
    this.messageQueue.push({
      ...message,
      queued_at: new Date().toISOString(),
    });
  }

  // キューに溜まったメッセージを送信
  private sendQueuedMessages() {
    if (this.messageQueue.length > 0 && this.connectionState === 'connected') {
      console.log(`Sending ${this.messageQueue.length} queued messages`);
      
      const messages = [...this.messageQueue];
      this.messageQueue = [];
      
      messages.forEach(message => {
        try {
          this.ws?.send(JSON.stringify(message));
        } catch (error) {
          console.error('Failed to send queued message:', error);
          this.queueMessage(message);
        }
      });
    }
  }

  // 拡張された追跡メソッド
  startEnhancedTracking(rideId: string, options = {
    locationUpdateInterval: 3000,
    statusSyncInterval: 8000,
  }) {
    this.startLocationTracking(rideId, options.locationUpdateInterval);
    this.startStatusSync(rideId, options.statusSyncInterval);
  }

  // 全ての追跡を停止
  stopAllTracking() {
    this.stopLocationUpdates();
    this.stopStatusSync();
    this.currentRideId = null;
  }

  // 緊急時メッセージ送信
  sendEmergencyAlert(rideId: string, alertType: string, location?: LocationUpdate) {
    const emergencyMessage = {
      type: 'emergency_alert',
      ride_id: rideId,
      alert_type: alertType,
      location,
      timestamp: new Date().toISOString(),
      priority: 'high',
    };

    // 緊急時は接続状態に関わらず送信を試行
    if (this.ws) {
      try {
        this.ws.send(JSON.stringify(emergencyMessage));
      } catch (error) {
        console.error('Failed to send emergency alert:', error);
        this.queueMessage(emergencyMessage);
      }
    } else {
      this.queueMessage(emergencyMessage);
    }
  }

  // 詳細接続情報取得
  getDetailedConnectionInfo() {
    return {
      state: this.connectionState,
      reconnectAttempts: this.reconnectAttempts,
      isReconnecting: this.isReconnecting,
      currentRideId: this.currentRideId,
      queuedMessages: this.messageQueue.length,
      hasActiveLocationTracking: this.locationUpdateInterval !== null,
      hasActiveStatusSync: this.statusSyncInterval !== null,
    };
  }

  private startHeartbeat() {
    // 30秒間隔でハートビート送信
    this.heartbeatInterval = setInterval(() => {
      if (this.connectionState === 'connected') {
        this.send({
          type: 'ping',
          timestamp: new Date().toISOString(),
        });
      }
    }, 30000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

// シングルトンインスタンス
export const websocketService = new WebSocketService();

// React Hook用のカスタムフック
export const useWebSocket = () => {
  return {
    connect: websocketService.connect.bind(websocketService),
    disconnect: websocketService.disconnect.bind(websocketService),
    send: websocketService.send.bind(websocketService),
    setEventHandlers: websocketService.setEventHandlers.bind(websocketService),
    subscribeToRideTracking: websocketService.subscribeToRideTracking.bind(websocketService),
    unsubscribeFromRideTracking: websocketService.unsubscribeFromRideTracking.bind(websocketService),
    subscribeToShipTracking: websocketService.subscribeToShipTracking.bind(websocketService),
    unsubscribeFromShipTracking: websocketService.unsubscribeFromShipTracking.bind(websocketService),
    subscribeToNotifications: websocketService.subscribeToNotifications.bind(websocketService),
    getConnectionState: websocketService.getConnectionState.bind(websocketService),
    setAuthToken: websocketService.setAuthToken.bind(websocketService),
    // 拡張されたリアルタイム機能
    startLocationTracking: websocketService.startLocationTracking.bind(websocketService),
    stopLocationUpdates: websocketService.stopLocationUpdates.bind(websocketService),
    startStatusSync: websocketService.startStatusSync.bind(websocketService),
    stopStatusSync: websocketService.stopStatusSync.bind(websocketService),
    startEnhancedTracking: websocketService.startEnhancedTracking.bind(websocketService),
    stopAllTracking: websocketService.stopAllTracking.bind(websocketService),
    sendEmergencyAlert: websocketService.sendEmergencyAlert.bind(websocketService),
    getDetailedConnectionInfo: websocketService.getDetailedConnectionInfo.bind(websocketService),
  };
};