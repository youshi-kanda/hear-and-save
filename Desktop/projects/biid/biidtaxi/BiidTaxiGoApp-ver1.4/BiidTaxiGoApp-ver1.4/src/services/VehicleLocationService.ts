// GO仕様: 車両現在地差分ポーリングサービス
// /api/vehicle-locations-updated/ エンドポイント、3-5秒間隔

export interface VehicleLocation {
  vehicle_id: string;
  latitude: number;
  longitude: number;
  heading: number; // 0-360度
  speed: number; // km/h
  status: 'available' | 'occupied' | 'en_route' | 'offline';
  last_updated: string; // ISO 8601 timestamp
  driver_info?: {
    name: string;
    rating: number;
    photo_url?: string;
  };
  vehicle_info?: {
    make: string;
    model: string;
    color: string;
    license_plate: string;
  };
}

export interface VehicleLocationUpdate {
  timestamp: string; // ISO 8601
  vehicles: VehicleLocation[];
  removed_vehicle_ids: string[]; // 削除された車両ID
}

const BASE_URL = 'https://taxiboat.hokkomarina.com';

class VehicleLocationService {
  private pollingInterval: NodeJS.Timeout | null = null;
  private lastUpdateTimestamp: string | null = null;
  private subscribers: Set<(vehicles: VehicleLocation[]) => void> = new Set();
  private currentVehicles: Map<string, VehicleLocation> = new Map();
  private isPolling = false;

  // GO仕様: 3-5秒間隔でのポーリング開始
  startPolling(intervalSeconds: number = 4): void {
    if (this.isPolling) {
      console.warn('Vehicle location polling is already active');
      return;
    }

    this.isPolling = true;
    console.log(`Starting vehicle location polling every ${intervalSeconds} seconds`);

    // 初回実行
    this.fetchLocationUpdates();

    // 定期実行開始
    this.pollingInterval = setInterval(() => {
      this.fetchLocationUpdates();
    }, intervalSeconds * 1000);
  }

  // ポーリング停止
  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isPolling = false;
    console.log('Vehicle location polling stopped');
  }

  // 購読者追加
  subscribe(callback: (vehicles: VehicleLocation[]) => void): () => void {
    this.subscribers.add(callback);
    
    // 現在のデータがあれば即座に通知
    if (this.currentVehicles.size > 0) {
      callback(Array.from(this.currentVehicles.values()));
    }

    // 購読解除関数を返す
    return () => {
      this.subscribers.delete(callback);
    };
  }

  // GO仕様: 差分更新データ取得
  private async fetchLocationUpdates(): Promise<void> {
    try {
      const url = new URL(`${BASE_URL}/api/vehicle-locations-updated/`);
      
      // 最後の更新タイムスタンプがあれば差分取得
      if (this.lastUpdateTimestamp) {
        url.searchParams.set('since', this.lastUpdateTimestamp);
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Vehicle location API error: ${response.status}`);
      }

      const updateData: VehicleLocationUpdate = await response.json();

      // 差分更新を適用
      this.applyLocationUpdates(updateData);

      // タイムスタンプ更新
      this.lastUpdateTimestamp = updateData.timestamp;

    } catch (error) {
      console.error('Failed to fetch vehicle location updates:', error);
      // エラー時も継続してポーリング
    }
  }

  // 差分更新を現在の車両リストに適用
  private applyLocationUpdates(update: VehicleLocationUpdate): void {
    let hasChanges = false;

    // 削除された車両を除去
    update.removed_vehicle_ids.forEach(vehicleId => {
      if (this.currentVehicles.delete(vehicleId)) {
        hasChanges = true;
      }
    });

    // 新規・更新車両を適用
    update.vehicles.forEach(vehicle => {
      const existing = this.currentVehicles.get(vehicle.vehicle_id);
      
      // 新規追加または位置・状態が変更された場合
      if (!existing || this.hasLocationChanged(existing, vehicle)) {
        this.currentVehicles.set(vehicle.vehicle_id, vehicle);
        hasChanges = true;
      }
    });

    // 変更があった場合のみ購読者に通知
    if (hasChanges) {
      const vehicles = Array.from(this.currentVehicles.values());
      this.notifySubscribers(vehicles);
    }
  }

  // 車両の位置・状態変更チェック
  private hasLocationChanged(old: VehicleLocation, updated: VehicleLocation): boolean {
    return (
      old.latitude !== updated.latitude ||
      old.longitude !== updated.longitude ||
      old.heading !== updated.heading ||
      old.speed !== updated.speed ||
      old.status !== updated.status ||
      old.last_updated !== updated.last_updated
    );
  }

  // 購読者に通知
  private notifySubscribers(vehicles: VehicleLocation[]): void {
    this.subscribers.forEach(callback => {
      try {
        callback(vehicles);
      } catch (error) {
        console.error('Error in vehicle location subscriber callback:', error);
      }
    });
  }

  // 特定エリア内の車両取得（フィルタリング用）
  getVehiclesInArea(
    centerLat: number, 
    centerLng: number, 
    radiusKm: number
  ): VehicleLocation[] {
    const vehicles = Array.from(this.currentVehicles.values());
    
    return vehicles.filter(vehicle => {
      const distance = this.calculateDistance(
        centerLat, centerLng,
        vehicle.latitude, vehicle.longitude
      );
      return distance <= radiusKm;
    });
  }

  // 利用可能な車両のみ取得
  getAvailableVehicles(): VehicleLocation[] {
    return Array.from(this.currentVehicles.values())
      .filter(vehicle => vehicle.status === 'available');
  }

  // 距離計算（ハーバサイン公式）
  private calculateDistance(
    lat1: number, lng1: number, 
    lat2: number, lng2: number
  ): number {
    const R = 6371; // 地球の半径 (km)
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // 現在の車両数取得
  getVehicleCount(): number {
    return this.currentVehicles.size;
  }

  // ポーリング状態確認
  isPollingActive(): boolean {
    return this.isPolling;
  }

  // 現在のすべての車両データ取得
  getCurrentVehicles(): VehicleLocation[] {
    return Array.from(this.currentVehicles.values());
  }

  // 特定車両の情報取得
  getVehicleById(vehicleId: string): VehicleLocation | undefined {
    return this.currentVehicles.get(vehicleId);
  }

  // リセット（テスト用）
  reset(): void {
    this.stopPolling();
    this.currentVehicles.clear();
    this.subscribers.clear();
    this.lastUpdateTimestamp = null;
  }
}

// シングルトンインスタンス
export const vehicleLocationService = new VehicleLocationService();

export default vehicleLocationService;