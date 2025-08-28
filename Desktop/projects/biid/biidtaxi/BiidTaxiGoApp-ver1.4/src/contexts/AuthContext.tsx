import React, {createContext, useContext, useState, useEffect, useCallback} from 'react';
import {authService} from '../services/api/authService';
import {websocketService} from '../services/websocket/websocketService';
import {User, LoginRequest, RegisterRequest} from '../services/api/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<boolean>; // 簡素化
  register: (userData: RegisterRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<boolean>;
  clearError: () => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({children}) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // 初期化時にローカルストレージからユーザー情報を復元
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = useCallback(async () => {
    try {
      setState(prev => ({...prev, isLoading: true}));

      console.log('Initializing auth...');

      // AsyncStorageが使用可能かチェック
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        await AsyncStorage.getItem('test'); // テスト呼び出し
        console.log('AsyncStorage is available');
      } catch (asyncStorageError) {
        console.error('AsyncStorage not available:', asyncStorageError);
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Storage initialization failed',
        });
        return;
      }

      // 認証サービス初期化
      let user = null;
      try {
        user = await authService.initializeAuth();
        console.log('Auth service initialized, user:', !!user);
      } catch (authError) {
        console.warn('Auth service initialization failed:', authError);
      }

      // 初回起動時に必ずCSRFトークンを取得（オプショナル）
      try {
        const {apiClient} = await import('../services/api/client');
        if (apiClient && apiClient.refreshAuth) {
          await apiClient.refreshAuth();
          console.log('CSRF token refreshed');
        }
      } catch (importError) {
        console.warn('Failed to import or use apiClient:', importError);
      }
      
      if (user) {
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        // WebSocket認証トークン設定
        const token = typeof localStorage !== 'undefined' 
          ? localStorage.getItem('auth_token') 
          : null;
        
        if (token) {
          websocketService.setAuthToken(token);
          // Django WebSocket通知接続開始
          try {
            await websocketService.subscribeToNotifications();
          } catch (error) {
            console.warn('WebSocket connection failed:', error);
          }
          
          // 通知サービス初期化
          const {notificationService} = await import('../services/notification/notificationService');
          notificationService.initialize();
        }
      } else {
        // ログインしていない場合でもCSRFトークンは必要
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Authentication initialization failed',
      });
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setState(prev => ({...prev, isLoading: true, error: null}));

      const response = await authService.login({ email, password });

      if (response.success && response.data) {
        setState({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        // Django WebSocket通知接続（開発環境ではスキップ）
        if (!__DEV__) {
          websocketService.setAuthToken(response.data.token);
          try {
            await websocketService.subscribeToNotifications();
          } catch (error) {
            console.warn('WebSocket connection failed:', error);
          }
        } else {
          console.log('🎭 Mock mode: Skipping WebSocket notification subscription in login');
        }

        // 通知サービス初期化
        const {notificationService} = await import('../services/notification/notificationService');
        notificationService.initialize();

        return true;
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: response.error || 'Login failed',
        }));
        return false;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Login failed',
      }));
      return false;
    }
  }, []);

  const register = useCallback(async (userData: RegisterRequest): Promise<boolean> => {
    try {
      setState(prev => ({...prev, isLoading: true, error: null}));

      const response = await authService.register(userData);

      if (response.success && response.data) {
        setState({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        // Django WebSocket通知接続（開発環境ではスキップ）
        if (!__DEV__) {
          websocketService.setAuthToken(response.data.token);
          try {
            await websocketService.subscribeToNotifications();
          } catch (error) {
            console.warn('WebSocket connection failed:', error);
          }
        } else {
          console.log('🎭 Mock mode: Skipping WebSocket notification subscription in register');
        }

        return true;
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: response.error || 'Registration failed',
        }));
        return false;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Registration failed',
      }));
      return false;
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.warn('Logout API call failed:', error);
    }

    // WebSocket切断
    websocketService.disconnect();
    websocketService.setAuthToken(null);

    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  }, []);

  const updateProfile = useCallback(async (userData: Partial<User>): Promise<boolean> => {
    try {
      setState(prev => ({...prev, isLoading: true, error: null}));

      const response = await authService.updateProfile(userData);

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          user: response.data,
          isLoading: false,
        }));
        return true;
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: response.error || 'Profile update failed',
        }));
        return false;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Profile update failed',
      }));
      return false;
    }
  }, []);

  const refreshUserData = useCallback(async (): Promise<void> => {
    if (!state.isAuthenticated) return;

    try {
      const response = await authService.getCurrentUser();

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          user: response.data,
        }));
      }
    } catch (error) {
      console.warn('Failed to refresh user data:', error);
    }
  }, [state.isAuthenticated]);

  const clearError = useCallback(() => {
    setState(prev => ({...prev, error: null}));
  }, []);

  const value: AuthContextValue = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    clearError,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// 認証が必要な画面で使用するHOC
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  return (props: P) => {
    const {isAuthenticated, isLoading} = useAuth();

    if (isLoading) {
      // ローディング画面を表示
      return null; // 実際のアプリではローディングコンポーネントを返す
    }

    if (!isAuthenticated) {
      // 未認証の場合はログイン画面にリダイレクト
      return null; // 実際のアプリではログイン画面にナビゲート
    }

    return <Component {...props} />;
  };
};