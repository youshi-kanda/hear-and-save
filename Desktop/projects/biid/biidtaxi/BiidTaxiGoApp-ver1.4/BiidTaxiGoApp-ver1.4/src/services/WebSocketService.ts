// GO仕様: WebSocket連携サービス
// /ws/ride/<ride_id>/ と /ws/ship/<reservation_id>/ でリアルタイムETA更新

export interface RideWebSocketMessage {
  type: 'eta_update' | 'status_change' | 'location_update' | 'driver_assigned' | 'ride_completed';
  data: {
    ride_id: string;
    eta_minutes?: number;
    status?: 'pending' | 'assigned' | 'en_route' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';
    driver_location?: {
      latitude: number;
      longitude: number;
      heading: number;
    };
    driver_info?: {
      name: string;
      phone: string;
      rating: number;
      vehicle: {
        make: string;
        model: string;
        color: string;
        license_plate: string;
      };
    };
    estimated_arrival?: string; // ISO 8601
    fare_update?: {
      total: number;
      currency: string;
      breakdown?: {
        base_fare: number;
        distance_fare: number;
        time_fare: number;
        surcharges: number;
      };
    };
    message?: string;
  };
  timestamp: string;
}

export interface ShipWebSocketMessage {
  type: 'eta_update' | 'status_change' | 'location_update' | 'captain_assigned' | 'voyage_completed';
  data: {
    reservation_id: string;
    eta_minutes?: number;
    status?: 'confirmed' | 'boarding' | 'departed' | 'en_route' | 'arrived' | 'completed' | 'cancelled';
    ship_location?: {
      latitude: number;
      longitude: number;
      heading: number;
      speed: number;
    };
    ship_info?: {
      name: string;
      captain: string;
      contact: string;
      capacity: number;
      facilities: string[];
    };
    estimated_arrival?: string; // ISO 8601
    weather_update?: {
      condition: string;
      visibility_km: number;
      wind_speed: number;
      delay_minutes?: number;
    };
    message?: string;
  };
  timestamp: string;
}

class WebSocketService {
  private connections: Map<string, WebSocket> = new Map();
  private subscribers: Map<string, Set<(message: any) => void>> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts = 5;
  private reconnectDelays = [1000, 2000, 4000, 8000, 16000]; // Exponential backoff
  private heartbeatInterval: Map<string, NodeJS.Timeout> = new Map();
  private pingInterval = 30000; // 30秒でping送信

  // GO仕様: タクシー乗車のWebSocket接続
  connectToRide(
    rideId: string, 
    onMessage: (message: RideWebSocketMessage) => void
  ): () => void {
    const connectionKey = `ride_${rideId}`;
    
    // 開発環境でのWebSocket接続をスキップ（Mock対応）
    if (__DEV__) {
      console.log(`🎭 Mock mode: Skipping WebSocket connection for ride ${rideId}`);
      // モック切断関数を返す
      return () => {
        console.log(`🎭 Mock mode: Disconnecting ride ${rideId}`);
      };
    }
    
    // 既存接続があればクリーンアップ
    this.disconnect(connectionKey);
    
    const wsUrl = `wss://taxiboat.hokkomarina.com/ws/ride/${rideId}/`;
    
    try {
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log(`Connected to ride WebSocket: ${rideId}`);
        this.reconnectAttempts.set(connectionKey, 0);
      };
      
      ws.onmessage = (event) => {
        try {
          const message: RideWebSocketMessage = JSON.parse(event.data);
          this.notifySubscribers(connectionKey, message);
          onMessage(message);
        } catch (error) {
          console.error('Failed to parse ride WebSocket message:', error);
        }
      };
      
      ws.onclose = (event) => {
        console.log(`Ride WebSocket closed: ${rideId}`, event.code, event.reason);
        this.handleReconnection(connectionKey, rideId, 'ride', onMessage);
      };
      
      ws.onerror = (error) => {
        console.error(`Ride WebSocket error: ${rideId}`, error);
      };
      
      this.connections.set(connectionKey, ws);
      this.addSubscriber(connectionKey, onMessage);
      
    } catch (error) {
      console.error(`Failed to connect to ride WebSocket: ${rideId}`, error);
    }
    
    // 切断用関数を返す
    return () => this.disconnect(connectionKey);
  }

  // GO仕様: 船舶予約のWebSocket接続
  connectToShip(
    reservationId: string, 
    onMessage: (message: ShipWebSocketMessage) => void
  ): () => void {
    const connectionKey = `ship_${reservationId}`;
    
    // 開発環境でのWebSocket接続をスキップ（Mock対応）
    if (__DEV__) {
      console.log(`🎭 Mock mode: Skipping WebSocket connection for ship ${reservationId}`);
      // モック切断関数を返す
      return () => {
        console.log(`🎭 Mock mode: Disconnecting ship ${reservationId}`);
      };
    }
    
    // 既存接続があればクリーンアップ
    this.disconnect(connectionKey);
    
    const wsUrl = `wss://taxiboat.hokkomarina.com/ws/ship/${reservationId}/`;
    
    try {
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log(`Connected to ship WebSocket: ${reservationId}`);
        this.reconnectAttempts.set(connectionKey, 0);
      };
      
      ws.onmessage = (event) => {
        try {
          const message: ShipWebSocketMessage = JSON.parse(event.data);
          this.notifySubscribers(connectionKey, message);
          onMessage(message);
        } catch (error) {
          console.error('Failed to parse ship WebSocket message:', error);
        }
      };
      
      ws.onclose = (event) => {
        console.log(`Ship WebSocket closed: ${reservationId}`, event.code, event.reason);
        this.handleReconnection(connectionKey, reservationId, 'ship', onMessage);
      };
      
      ws.onerror = (error) => {
        console.error(`Ship WebSocket error: ${reservationId}`, error);
      };
      
      this.connections.set(connectionKey, ws);
      this.addSubscriber(connectionKey, onMessage);
      
    } catch (error) {
      console.error(`Failed to connect to ship WebSocket: ${reservationId}`, error);
    }
    
    // 切断用関数を返す
    return () => this.disconnect(connectionKey);
  }

  // 再接続処理
  private handleReconnection(
    connectionKey: string,
    resourceId: string,
    type: 'ride' | 'ship',
    onMessage: (message: any) => void
  ): void {
    const attempts = this.reconnectAttempts.get(connectionKey) || 0;
    
    if (attempts < this.maxReconnectAttempts) {
      this.reconnectAttempts.set(connectionKey, attempts + 1);
      
      console.log(`Attempting to reconnect ${type} WebSocket (${attempts + 1}/${this.maxReconnectAttempts}): ${resourceId}`);
      
      setTimeout(() => {
        if (type === 'ride') {
          this.connectToRide(resourceId, onMessage);
        } else {
          this.connectToShip(resourceId, onMessage);
        }
      }, this.reconnectDelay * (attempts + 1)); // 指数バックオフ
    } else {
      console.error(`Max reconnection attempts reached for ${type} WebSocket: ${resourceId}`);
    }
  }

  // 購読者管理
  private addSubscriber(connectionKey: string, callback: (message: any) => void): void {
    if (!this.subscribers.has(connectionKey)) {
      this.subscribers.set(connectionKey, new Set());
    }
    this.subscribers.get(connectionKey)!.add(callback);
  }

  private notifySubscribers(connectionKey: string, message: any): void {
    const subscribers = this.subscribers.get(connectionKey);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(message);
        } catch (error) {
          console.error('Error in WebSocket subscriber callback:', error);
        }
      });
    }
  }

  // 接続切断
  private disconnect(connectionKey: string): void {
    const ws = this.connections.get(connectionKey);
    if (ws) {
      ws.close();
      this.connections.delete(connectionKey);
    }
    
    this.subscribers.delete(connectionKey);
    this.reconnectAttempts.delete(connectionKey);
  }

  // メッセージ送信（必要に応じて）
  sendMessage(connectionKey: string, message: any): void {
    const ws = this.connections.get(connectionKey);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    } else {
      console.warn(`Cannot send message: WebSocket ${connectionKey} is not connected`);
    }
  }

  // 接続状態確認
  isConnected(connectionKey: string): boolean {
    const ws = this.connections.get(connectionKey);
    return ws ? ws.readyState === WebSocket.OPEN : false;
  }

  // すべての接続を切断
  disconnectAll(): void {
    this.connections.forEach((ws, key) => {
      this.disconnect(key);
    });
    
    console.log('All WebSocket connections disconnected');
  }

  // 接続数取得
  getConnectionCount(): number {
    return this.connections.size;
  }

  // アクティブな接続一覧取得
  getActiveConnections(): string[] {
    const active: string[] = [];
    this.connections.forEach((ws, key) => {
      if (ws.readyState === WebSocket.OPEN) {
        active.push(key);
      }
    });
    return active;
  }
}

// シングルトンインスタンス
export const webSocketService = new WebSocketService();

// GO仕様: WebSocketメッセージタイプガード
export const isRideMessage = (message: any): message is RideWebSocketMessage => {
  return message && typeof message.data?.ride_id === 'string';
};

export const isShipMessage = (message: any): message is ShipWebSocketMessage => {
  return message && typeof message.data?.reservation_id === 'string';
};

// GO仕様: ETA更新ヘルパー関数
export const formatETA = (etaMinutes: number): string => {
  if (etaMinutes <= 0) {
    return 'まもなく到着';
  } else if (etaMinutes === 1) {
    return '約1分';
  } else {
    return `約${etaMinutes}分`;
  }
};

export default webSocketService;