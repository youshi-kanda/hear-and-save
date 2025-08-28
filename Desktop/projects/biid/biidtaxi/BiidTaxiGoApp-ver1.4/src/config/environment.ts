// 環境変数設定
import { Platform } from 'react-native';

export interface EnvironmentConfig {
  API_BASE_URL: string;
  WS_BASE_URL: string;
  API_TIMEOUT: number;
  APP_NAME: string;
  APP_VERSION: string;
  ENABLE_SSL_PINNING: boolean;
  ENABLE_DEBUG_LOGS: boolean;
  ENABLE_MOCK_DATA: boolean;
  REQUEST_TIMEOUT_MS: number;
  WEBSOCKET_TIMEOUT_MS: number;
}

// 環境判定
const isProduction = !__DEV__;
const isDevelopment = __DEV__;

// 本番環境設定
const PRODUCTION_CONFIG: EnvironmentConfig = {
  API_BASE_URL: 'https://taxiboat.hokkomarina.com',
  WS_BASE_URL: 'wss://taxiboat.hokkomarina.com',
  API_TIMEOUT: 15000,
  APP_NAME: 'BiidTaxi GO',
  APP_VERSION: '1.0.0',
  ENABLE_SSL_PINNING: true,
  ENABLE_DEBUG_LOGS: false,
  ENABLE_MOCK_DATA: false,
  REQUEST_TIMEOUT_MS: 15000,
  WEBSOCKET_TIMEOUT_MS: 30000,
};

// 開発環境設定
const DEVELOPMENT_CONFIG: EnvironmentConfig = {
  API_BASE_URL: 'http://192.168.0.101:8000', // 実機テスト用ローカルIP
  WS_BASE_URL: 'ws://192.168.0.101:8000',
  API_TIMEOUT: 45000,
  APP_NAME: 'BiidTaxi GO (Dev)',
  APP_VERSION: '1.0.0-dev',
  ENABLE_SSL_PINNING: false,
  ENABLE_DEBUG_LOGS: true,
  ENABLE_MOCK_DATA: true, // モックデータを有効にしてAPI依存を回避
  REQUEST_TIMEOUT_MS: 45000,
  WEBSOCKET_TIMEOUT_MS: 60000,
};

// 現在の環境設定を取得
export const ENV_CONFIG: EnvironmentConfig = isProduction 
  ? PRODUCTION_CONFIG 
  : DEVELOPMENT_CONFIG;

// API エンドポイント
export const API_ENDPOINTS = {
  // 認証関連
  AUTH: {
    CSRF: '/accounts/csrf/',
    LOGIN: '/accounts/login/',
    LOGOUT: '/accounts/logout/',
  },
  
  // タクシー関連
  TAXI: {
    PRICING: '/taxi/api/pricing/estimate/',
    QUICK_RIDES: '/taxi/api/quick-rides/init/',
    RIDES: '/taxi/api/rides/',
    DRIVERS_NEARBY: '/taxi/api/drivers/nearby/',
  },
  
  // 船舶関連
  SHIP: {
    FARE: '/accounts/api/ship/fare/',
    FACILITIES: '/accounts/api/ship/facilities/',
    BOOK: '/accounts/api/ship/book/',
    RESERVATIONS: '/accounts/api/ship/reservations/',
  },
  
  // WebSocket
  WEBSOCKET: {
    RIDE: '/ws/ride/',
    SHIP: '/ws/ship/',
  },
};

// ログ出力制御
export const logger = {
  log: (...args: any[]) => {
    if (ENV_CONFIG.ENABLE_DEBUG_LOGS) {
      console.log(...args);
    }
  },
  warn: (...args: any[]) => {
    if (ENV_CONFIG.ENABLE_DEBUG_LOGS) {
      console.warn(...args);
    }
  },
  error: (...args: any[]) => {
    console.error(...args); // エラーは常に出力
  },
};

// 環境情報の表示
export const getEnvironmentInfo = () => {
  return {
    platform: Platform.OS,
    version: Platform.Version,
    isProduction,
    isDevelopment,
    config: ENV_CONFIG,
  };
};

console.log('Environment Info:', getEnvironmentInfo());