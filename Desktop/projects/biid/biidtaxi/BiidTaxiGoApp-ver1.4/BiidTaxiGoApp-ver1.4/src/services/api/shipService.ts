import {apiClient} from './client';
import {ApiResponse} from './types';

// 船舶予約関連の型定義
export interface Port {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  facilities?: string[];
  operating_hours?: {
    open: string;
    close: string;
  };
}

export interface ShipEstimateRequest {
  departure_port_id: string;
  arrival_port_id: string;
  departure_date: string; // ISO date string
  passengers: number;
  vessel_type?: 'ferry' | 'jetfoil' | 'any';
}

export interface ShipEstimateResponse {
  estimated_fare: number;
  estimated_time_minutes: number;
  distance_km: number;
  duration_text: string;
  available_schedules: ShipSchedule[];
  weather_conditions?: {
    condition: string;
    wave_height: number;
    wind_speed: number;
    visibility: string;
  };
}

export interface ShipSchedule {
  id: string;
  departure_port: Port;
  arrival_port: Port;
  departure_time: string;
  arrival_time: string;
  vessel_type: 'ferry' | 'jetfoil';
  vessel_name: string;
  vessel_capacity: number;
  available_seats: number;
  fare_per_person: number;
  duration_minutes: number;
  is_operating: boolean;
  cancellation_reason?: string;
}

export interface ShipReservationRequest {
  schedule_id: string;
  passengers: number;
  passenger_details: PassengerDetail[];
  contact_phone: string;
  contact_email: string;
  special_requests?: string;
  payment_method: 'cash' | 'card' | 'mobile';
}

export interface PassengerDetail {
  name: string;
  age_category: 'adult' | 'child' | 'senior';
  special_needs?: string;
}

export interface ShipReservation {
  id: string;
  reservation_number: string;
  schedule: ShipSchedule;
  passengers: number;
  passenger_details: PassengerDetail[];
  status: 'pending' | 'confirmed' | 'checked_in' | 'boarded' | 'completed' | 'cancelled';
  total_fare: number;
  contact_phone: string;
  contact_email: string;
  special_requests?: string;
  payment_method: string;
  payment_status: 'pending' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  boarding_pass_url?: string;
  cancellation_deadline: string;
}

export interface ShipTrackingInfo {
  reservation_id: string;
  current_status: ShipReservation['status'];
  vessel_location?: {
    latitude: number;
    longitude: number;
    heading: number;
    speed_knots: number;
  };
  estimated_arrival: string;
  delay_minutes: number;
  weather_update?: {
    condition: string;
    wave_height: number;
    visibility: string;
    is_safe_to_operate: boolean;
  };
  announcements: string[];
  next_update_at: string;
}

class ShipService {
  // 港一覧取得
  async getPorts(region?: string): Promise<ApiResponse<Port[]>> {
    try {
      const params = region ? `?region=${region}` : '';
      return await apiClient.get<Port[]>(`/boat/api/ports/${params}`);
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get ports',
      };
    }
  }

  // 特定港の詳細情報
  async getPortDetails(portId: string): Promise<ApiResponse<Port & {
    weather_current?: {
      condition: string;
      temperature: number;
      wind_speed: number;
      wave_height: number;
    };
    nearby_facilities?: {
      name: string;
      type: string;
      distance_meters: number;
    }[];
  }>> {
    try {
      return await apiClient.get(`/boat/api/ports/${portId}/`);
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get port details',
      };
    }
  }

  // 船舶料金・時間見積
  async getShipEstimate(request: ShipEstimateRequest): Promise<ApiResponse<ShipEstimateResponse>> {
    try {
      return await apiClient.post<ShipEstimateResponse>('/boat/api/estimate/', request);
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get ship estimate',
      };
    }
  }

  // 時刻表検索
  async searchSchedules(
    departurePortId: string,
    arrivalPortId: string,
    date: string,
    vesselType?: 'ferry' | 'jetfoil'
  ): Promise<ApiResponse<ShipSchedule[]>> {
    try {
      const params = new URLSearchParams({
        departure_port: departurePortId,
        arrival_port: arrivalPortId,
        date,
      });
      
      if (vesselType) {
        params.append('vessel_type', vesselType);
      }

      return await apiClient.get<ShipSchedule[]>(`/boat/api/schedules/?${params}`);
    } catch (error) {
      return {
        success: false,
        error: 'Failed to search schedules',
      };
    }
  }

  // 船舶予約作成
  async createReservation(request: ShipReservationRequest): Promise<ApiResponse<ShipReservation>> {
    try {
      return await apiClient.post<ShipReservation>('/boat/api/reservations/', request);
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create reservation',
      };
    }
  }

  // 予約詳細取得
  async getReservation(reservationId: string): Promise<ApiResponse<ShipReservation>> {
    try {
      return await apiClient.get<ShipReservation>(`/boat/api/reservations/${reservationId}/`);
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get reservation',
      };
    }
  }

  // 予約一覧取得
  async getUserReservations(
    status?: ShipReservation['status'],
    limit = 20
  ): Promise<ApiResponse<ShipReservation[]>> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
      });
      
      if (status) {
        params.append('status', status);
      }

      return await apiClient.get<ShipReservation[]>(`/boat/api/reservations/?${params}`);
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get user reservations',
      };
    }
  }

  // 予約キャンセル
  async cancelReservation(
    reservationId: string,
    reason?: string
  ): Promise<ApiResponse<{message: string; refund_amount?: number}>> {
    try {
      return await apiClient.post(`/boat/api/reservations/${reservationId}/cancel/`, {
        reason,
      });
    } catch (error) {
      return {
        success: false,
        error: 'Failed to cancel reservation',
      };
    }
  }

  // 予約変更
  async updateReservation(
    reservationId: string,
    updates: Partial<ShipReservationRequest>
  ): Promise<ApiResponse<ShipReservation>> {
    try {
      return await apiClient.patch<ShipReservation>(
        `/boat/api/reservations/${reservationId}/`,
        updates
      );
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update reservation',
      };
    }
  }

  // リアルタイム追跡情報取得
  async getTrackingInfo(reservationId: string): Promise<ApiResponse<ShipTrackingInfo>> {
    try {
      return await apiClient.get<ShipTrackingInfo>(
        `/boat/api/reservations/${reservationId}/tracking/`
      );
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get tracking info',
      };
    }
  }

  // チェックイン
  async checkIn(
    reservationId: string,
    checkInData?: {
      qr_code?: string;
      boarding_time?: string;
    }
  ): Promise<ApiResponse<{
    message: string;
    boarding_pass_url: string;
    boarding_gate: string;
    boarding_time: string;
  }>> {
    try {
      return await apiClient.post(`/boat/api/reservations/${reservationId}/checkin/`, checkInData);
    } catch (error) {
      return {
        success: false,
        error: 'Failed to check in',
      };
    }
  }

  // 乗船確認
  async confirmBoarding(reservationId: string): Promise<ApiResponse<{message: string}>> {
    try {
      return await apiClient.post(`/boat/api/reservations/${reservationId}/board/`);
    } catch (error) {
      return {
        success: false,
        error: 'Failed to confirm boarding',
      };
    }
  }

  // 運航状況取得
  async getServiceStatus(
    portId?: string,
    date?: string
  ): Promise<ApiResponse<{
    overall_status: 'normal' | 'delayed' | 'cancelled' | 'suspended';
    affected_routes: {
      departure_port: string;
      arrival_port: string;
      status: string;
      reason?: string;
      estimated_delay_minutes?: number;
    }[];
    weather_conditions: {
      condition: string;
      wave_height: number;
      wind_speed: number;
      visibility: string;
      is_safe_to_operate: boolean;
    };
    next_update_at: string;
    announcements: string[];
  }>> {
    try {
      const params = new URLSearchParams();
      if (portId) params.append('port_id', portId);
      if (date) params.append('date', date);

      return await apiClient.get(`/boat/api/service-status/?${params}`);
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get service status',
      };
    }
  }

  // 評価・レビュー送信
  async submitReview(
    reservationId: string,
    review: {
      rating: number; // 1-5
      comment?: string;
      categories?: {
        vessel_condition: number;
        staff_service: number;
        punctuality: number;
        comfort: number;
      };
    }
  ): Promise<ApiResponse<{message: string}>> {
    try {
      return await apiClient.post(`/boat/api/reservations/${reservationId}/review/`, review);
    } catch (error) {
      return {
        success: false,
        error: 'Failed to submit review',
      };
    }
  }

  // 緊急連絡
  async emergencyContact(
    reservationId: string,
    emergency: {
      type: 'medical' | 'safety' | 'weather' | 'other';
      description: string;
      location?: {
        latitude: number;
        longitude: number;
      };
      contact_phone: string;
    }
  ): Promise<ApiResponse<{
    message: string;
    emergency_id: string;
    response_eta_minutes: number;
  }>> {
    try {
      return await apiClient.post(`/boat/api/emergency/`, {
        reservation_id: reservationId,
        ...emergency,
      });
    } catch (error) {
      return {
        success: false,
        error: 'Failed to send emergency contact',
      };
    }
  }

  // 予約履歴取得
  async getBookings(limit?: number, offset?: number): Promise<ApiResponse<any[]>> {
    try {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (offset) params.append('offset', offset.toString());
      
      const queryString = params.toString();
      const endpoint = queryString ? `/boat/api/reservations/?${queryString}` : '/boat/api/reservations/';
      
      return await apiClient.get<any[]>(endpoint);
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get bookings',
        data: [],
      };
    }
  }
}

export const shipService = new ShipService();