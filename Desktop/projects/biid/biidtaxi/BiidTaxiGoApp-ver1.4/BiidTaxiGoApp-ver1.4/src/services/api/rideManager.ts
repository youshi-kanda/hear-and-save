// 中央化されたRide管理サービス
import { taxiService } from './taxiService';

export class RideManager {
  private static instance: RideManager;
  private isInitialized: boolean = false;

  static getInstance(): RideManager {
    if (!RideManager.instance) {
      RideManager.instance = new RideManager();
    }
    return RideManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('Initializing RideManager...');
      
      // TaxiServiceからストレージのRide IDを復元
      await taxiService.initializeFromStorage();
      
      const currentRideId = await taxiService.getCurrentRideId();
      if (currentRideId) {
        console.log(`Current ride restored from storage: ${currentRideId}`);
        
        // Rideの有効性を確認
        const validation = await taxiService.isRideValid(currentRideId);
        if (!validation.valid) {
          console.log(`Current ride ${currentRideId} is invalid (${validation.reason}), clearing...`);
          await taxiService.setCurrentRideId(null);
        }
      }
      
      this.isInitialized = true;
      console.log('RideManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RideManager:', error);
    }
  }

  async getCurrentRideId(): Promise<string | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return await taxiService.getCurrentRideId();
  }

  async validateCurrentRide(): Promise<{ valid: boolean; rideId?: string; reason?: string }> {
    const rideId = await this.getCurrentRideId();
    
    if (!rideId) {
      return { valid: false, reason: 'no_current_ride' };
    }

    const validation = await taxiService.isRideValid(rideId);
    return {
      valid: validation.valid,
      rideId: rideId,
      reason: validation.reason,
    };
  }

  async ensureValidRide(params?: {
    pickup_location: { latitude: number; longitude: number; address?: string };
    destination_location?: { latitude: number; longitude: number; address?: string };
  }): Promise<{ rideId: string | null; isNew: boolean; error?: string }> {
    return await taxiService.ensureValidRideId(params);
  }

  // アプリが一時停止から復帰した際の処理
  async onAppResume(): Promise<void> {
    console.log('RideManager: App resumed, validating current ride...');
    
    const validation = await this.validateCurrentRide();
    
    if (!validation.valid && validation.rideId) {
      console.log(`Ride ${validation.rideId} became invalid while app was in background (${validation.reason})`);
      await taxiService.setCurrentRideId(null);
    }
  }

  // アプリが終了する際の処理
  async onAppTerminate(): Promise<void> {
    console.log('RideManager: App terminating...');
    // 必要に応じてクリーンアップ処理を追加
  }
}

// シングルトンインスタンス
export const rideManager = RideManager.getInstance();