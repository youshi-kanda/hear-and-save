// GO仕様: 船舶API連携サービス
// /accounts/api/ship/ エンドポイント群（fare, facilities, book, reservations）

export interface ShipLocation {
  latitude: number;
  longitude: number;
  name: string;
  address?: string;
}

export interface ShipFareRequest {
  pickup_lat: number;
  pickup_lng: number;
  dropoff_lat: number;
  dropoff_lng: number;
  passenger_count?: number;
}

export interface ShipFareResponse {
  base_fare: number;
  distance_fare: number;
  total_fare: number;
  estimated_time_minutes: number;
  distance_km: number;
  currency: string;
  weather_surcharge?: number;
  night_surcharge?: number;
}

export interface ShipFacility {
  id: string;
  name: string;
  type: 'restroom' | 'wifi' | 'refreshments' | 'accessibility' | 'luggage';
  available: boolean;
  description?: string;
}

export interface ShipBookingRequest {
  pickup_lat: number;
  pickup_lng: number;
  pickup_address: string;
  dropoff_lat: number;
  dropoff_lng: number;
  dropoff_address: string;
  passenger_count: number;
  scheduled_time?: string; // ISO 8601 format
  special_requests?: string;
  contact_phone: string;
  contact_name: string;
}

export interface ShipBookingResponse {
  booking_id: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  pickup_time: string;
  estimated_arrival_time: string;
  ship_info: {
    name: string;
    capacity: number;
    facilities: string[];
  };
  fare: ShipFareResponse;
  booking_reference: string;
}

export interface ShipReservation {
  id: string;
  booking_reference: string;
  status: 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
  pickup_location: ShipLocation;
  dropoff_location: ShipLocation;
  pickup_time: string;
  estimated_arrival_time: string;
  passenger_count: number;
  fare: number;
  ship_info: {
    name: string;
    captain: string;
    contact: string;
  };
  created_at: string;
  updated_at: string;
}

const BASE_URL = 'https://taxiboat.hokkomarina.com';

class ShipApiService {
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      ...options,
    };

    try {
      const response = await fetch(url, defaultOptions);
      
      if (!response.ok) {
        throw new Error(`Ship API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Ship API request failed:', error);
      throw error;
    }
  }

  // GO仕様: 船舶料金見積もり
  async getFare(request: ShipFareRequest): Promise<ShipFareResponse> {
    return this.makeRequest<ShipFareResponse>('/accounts/api/ship/fare/', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // GO仕様: 船舶設備情報取得
  async getFacilities(): Promise<ShipFacility[]> {
    return this.makeRequest<ShipFacility[]>('/accounts/api/ship/facilities/', {
      method: 'GET',
    });
  }

  // GO仕様: 船舶予約作成
  async createBooking(request: ShipBookingRequest): Promise<ShipBookingResponse> {
    return this.makeRequest<ShipBookingResponse>('/accounts/api/ship/book/', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // GO仕様: 船舶予約一覧取得
  async getReservations(userId?: string): Promise<ShipReservation[]> {
    const endpoint = userId 
      ? `/accounts/api/ship/reservations/?user_id=${userId}`
      : '/accounts/api/ship/reservations/';
      
    return this.makeRequest<ShipReservation[]>(endpoint, {
      method: 'GET',
    });
  }

  // GO仕様: 特定の予約詳細取得
  async getReservationById(reservationId: string): Promise<ShipReservation> {
    return this.makeRequest<ShipReservation>(`/accounts/api/ship/reservations/${reservationId}/`, {
      method: 'GET',
    });
  }

  // GO仕様: 予約キャンセル
  async cancelReservation(reservationId: string): Promise<{success: boolean; message: string}> {
    return this.makeRequest(`/accounts/api/ship/reservations/${reservationId}/cancel/`, {
      method: 'POST',
    });
  }

  // GO仕様: 船舶の現在位置取得（リアルタイム追跡用）
  async getShipLocation(shipId: string): Promise<{
    latitude: number;
    longitude: number;
    heading: number;
    speed: number;
    last_updated: string;
  }> {
    return this.makeRequest(`/accounts/api/ship/location/${shipId}/`, {
      method: 'GET',
    });
  }

  // GO仕様: 利用可能な船舶一覧（特定エリア内）
  async getAvailableShips(area: {
    center_lat: number;
    center_lng: number;
    radius_km: number;
  }): Promise<Array<{
    id: string;
    name: string;
    capacity: number;
    current_location: {latitude: number; longitude: number};
    estimated_arrival_minutes: number;
    facilities: string[];
  }>> {
    return this.makeRequest('/accounts/api/ship/available/', {
      method: 'POST',
      body: JSON.stringify(area),
    });
  }
}

// シングルトンインスタンス
export const shipApiService = new ShipApiService();

// GO仕様: 船舶APIエラーハンドリング用ヘルパー関数
export const handleShipApiError = (error: unknown): string => {
  if (error instanceof Error) {
    if (error.message.includes('401')) {
      return '認証が必要です。ログインしてください。';
    } else if (error.message.includes('403')) {
      return '船舶サービスへのアクセス権限がありません。';
    } else if (error.message.includes('404')) {
      return '指定された船舶情報が見つかりません。';
    } else if (error.message.includes('500')) {
      return '船舶サービスで一時的な問題が発生しています。';
    } else if (error.message.includes('Network')) {
      return 'ネットワーク接続を確認してください。';
    }
    return error.message;
  }
  return '不明なエラーが発生しました。';
};

export default shipApiService;