import React, {createContext, useContext, useState, useCallback, ReactNode} from 'react';
import {GoTheme} from '../theme/GoTheme';

// サービスモード定義
export type ServiceMode = 'ship' | 'taxi';

// テーマコンテキストの型定義
export interface ThemeContextType {
  // 現在のサービスモード
  currentMode: ServiceMode;
  
  // モード切替関数
  switchMode: (mode: ServiceMode) => void;
  toggleMode: () => void;
  
  // 現在のモードに基づいたテーマ取得
  getAccentColor: () => string;
  getModeIcon: () => string;
  getRouteStyle: () => string;
  
  // グラデーション取得
  getPrimaryGradient: () => string[];
  getModeGradient: () => string[];
  
  // ベーステーマ
  theme: typeof GoTheme;
}

// コンテキスト作成
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// プロバイダーのProps
export interface ThemeProviderProps {
  children: ReactNode;
  initialMode?: ServiceMode;
}

// テーマプロバイダーコンポーネント
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialMode = 'taxi', // デフォルトはタクシーモード
}) => {
  const [currentMode, setCurrentMode] = useState<ServiceMode>(initialMode);

  // モード切替
  const switchMode = useCallback((mode: ServiceMode) => {
    setCurrentMode(mode);
  }, []);

  // モードトグル
  const toggleMode = useCallback(() => {
    setCurrentMode(prev => prev === 'ship' ? 'taxi' : 'ship');
  }, []);

  // 現在のモードのアクセントカラー取得
  const getAccentColor = useCallback(() => {
    return GoTheme.modes[currentMode].accent;
  }, [currentMode]);

  // 現在のモードのアイコン取得
  const getModeIcon = useCallback(() => {
    return GoTheme.modes[currentMode].icon;
  }, [currentMode]);

  // 現在のモードのルートスタイル取得
  const getRouteStyle = useCallback(() => {
    return GoTheme.modes[currentMode].routeStyle;
  }, [currentMode]);

  // プライマリグラデーション取得
  const getPrimaryGradient = useCallback(() => {
    return GoTheme.colors.gradientPrimary;
  }, []);

  // 現在のモードのグラデーション取得
  const getModeGradient = useCallback(() => {
    if (currentMode === 'ship') {
      return [GoTheme.colors.primary, GoTheme.colors.shipAccent];
    } else {
      return [GoTheme.colors.primary, GoTheme.colors.taxiAccent];
    }
  }, [currentMode]);

  // コンテキスト値
  const contextValue: ThemeContextType = {
    currentMode,
    switchMode,
    toggleMode,
    getAccentColor,
    getModeIcon,
    getRouteStyle,
    getPrimaryGradient,
    getModeGradient,
    theme: GoTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// カスタムフック: テーマの使用
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// カスタムフック: 現在のモード取得
export const useCurrentMode = (): ServiceMode => {
  const {currentMode} = useTheme();
  return currentMode;
};

// カスタムフック: モード関連色取得
export const useModeColors = () => {
  const {getAccentColor, getModeGradient, theme, currentMode} = useTheme();
  
  return {
    accent: getAccentColor(),
    gradient: getModeGradient(),
    primary: theme.colors.primary,
    primaryLight: theme.colors.primaryLight,
    isShipMode: currentMode === 'ship',
    isTaxiMode: currentMode === 'taxi',
  };
};

// カスタムフック: アニメーション設定取得
export const useAnimationConfig = () => {
  const {theme} = useTheme();
  return theme.animation;
};