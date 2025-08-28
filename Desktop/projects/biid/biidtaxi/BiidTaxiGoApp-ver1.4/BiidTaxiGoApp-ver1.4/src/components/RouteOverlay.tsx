import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import {GoTheme} from '../theme/GoTheme';
import {useTheme} from '../contexts/ThemeContext';

export interface RouteOverlayProps {
  // ルート座標
  fromLocation?: {latitude: number; longitude: number};
  toLocation?: {latitude: number; longitude: number};
  
  // 中間ポイント（オプション）
  waypoints?: Array<{latitude: number; longitude: number; name?: string}>;
  
  // 表示設定
  routeType?: 'taxi' | 'ship' | 'walking';
  showDirections?: boolean;
  animated?: boolean;
  
  // スタイル
  routeColor?: string;
  routeWidth?: number;
  style?: ViewStyle;
  
  // コールバック
  onRouteCalculated?: (distance: number, duration: number) => void;
}

interface RouteData {
  coordinates: Array<{latitude: number; longitude: number}>;
  distance: number; // km
  duration: number; // minutes
  instructions?: string[];
}

/**
 * RouteOverlay: 目的地ベースのルート表示コンポーネント
 * WebViewの地図上にルートを描画するためのデータを提供
 */
export const RouteOverlay: React.FC<RouteOverlayProps> = ({
  fromLocation,
  toLocation,
  waypoints = [],
  routeType = 'taxi',
  showDirections = false,
  animated = true,
  routeColor,
  routeWidth = 4,
  style,
  onRouteCalculated,
}) => {
  const {currentMode, getAccentColor} = useTheme();
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // ルートカラーを決定
  const getRouteColor = (): string => {
    if (routeColor) return routeColor;
    
    switch (routeType) {
      case 'ship':
        return '#3B82F6'; // 青系（船舶）
      case 'walking':
        return '#10B981'; // 緑系（徒歩）
      case 'taxi':
      default:
        return getAccentColor(); // テーマカラー（タクシー）
    }
  };

  // OSRM (Open Source Routing Machine) を使用したルート計算
  const calculateRouteWithOSRM = async (
    from: {latitude: number; longitude: number},
    to: {latitude: number; longitude: number}
  ): Promise<RouteData> => {
    try {
      const profile = routeType === 'ship' ? 'driving' : routeType === 'walking' ? 'foot' : 'driving';
      
      // 中間ポイントを含むルート構築
      const coordinates = [from, ...waypoints, to];
      const coordinatesString = coordinates
        .map(coord => `${coord.longitude},${coord.latitude}`)
        .join(';');

      const url = `https://router.project-osrm.org/route/v1/${profile}/${coordinatesString}?overview=full&geometries=geojson&steps=${showDirections}`;
      
      console.log('OSRM Route calculation:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`OSRM API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.routes || data.routes.length === 0) {
        throw new Error('No route found');
      }
      
      const route = data.routes[0];
      
      // GeoJSON geometry を座標配列に変換
      const routeCoordinates = route.geometry.coordinates.map((coord: [number, number]) => ({
        longitude: coord[0],
        latitude: coord[1],
      }));
      
      // ステップを指示文に変換（オプション）
      const instructions = showDirections && route.legs 
        ? route.legs.flatMap((leg: any) => 
            leg.steps?.map((step: any) => step.maneuver?.instruction || '直進') || []
          )
        : undefined;
      
      return {
        coordinates: routeCoordinates,
        distance: Math.round((route.distance / 1000) * 10) / 10, // メートルをkmに変換
        duration: Math.round(route.duration / 60), // 秒を分に変換
        instructions,
      };
      
    } catch (error) {
      console.error('OSRM route calculation failed:', error);
      // フォールバック: 直線ルート
      return calculateStraightLineRoute(from, to);
    }
  };

  // 直線ルートのフォールバック
  const calculateStraightLineRoute = (
    from: {latitude: number; longitude: number},
    to: {latitude: number; longitude: number}
  ): RouteData => {
    // ハーバサイン距離計算
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371; // 地球の半径 (km)
    
    const dLat = toRad(to.latitude - from.latitude);
    const dLon = toRad(to.longitude - from.longitude);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(from.latitude)) * Math.cos(toRad(to.latitude)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    // 移動手段別の推定時間
    const avgSpeed = routeType === 'ship' ? 25 : routeType === 'walking' ? 5 : 30;
    const estimatedDuration = Math.round((distance / avgSpeed) * 60);
    
    return {
      coordinates: [from, to],
      distance: Math.round(distance * 10) / 10,
      duration: estimatedDuration,
    };
  };

  // ルート計算実行
  const calculateRoute = async () => {
    if (!fromLocation || !toLocation) return;
    
    setIsCalculating(true);
    setError(null);
    
    try {
      const route = await calculateRouteWithOSRM(fromLocation, toLocation);
      setRouteData(route);
      onRouteCalculated?.(route.distance, route.duration);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ルート計算に失敗しました';
      setError(errorMessage);
      console.error('Route calculation error:', err);
    } finally {
      setIsCalculating(false);
    }
  };

  // 座標変更時にルートを再計算
  useEffect(() => {
    if (fromLocation && toLocation) {
      const timer = setTimeout(calculateRoute, 500); // デバウンス
      return () => clearTimeout(timer);
    } else {
      setRouteData(null);
    }
  }, [fromLocation, toLocation, waypoints, routeType]);

  // WebView地図で使用するためのJavaScriptコード生成
  const generateMapScript = (): string => {
    if (!routeData) return '';
    
    const coordinates = routeData.coordinates.map(coord => 
      `[${coord.latitude}, ${coord.longitude}]`
    ).join(',');
    
    return `
      // ルートを地図に描画
      if (window.currentRoute) {
        map.removeLayer(window.currentRoute);
      }
      
      var routeCoordinates = [${coordinates}];
      
      window.currentRoute = L.polyline(routeCoordinates, {
        color: '${getRouteColor()}',
        weight: ${routeWidth},
        opacity: 0.8,
        smoothFactor: 1.0
      }).addTo(map);
      
      // 必要に応じて地図の表示範囲を調整
      var group = new L.featureGroup([window.currentRoute]);
      map.fitBounds(group.getBounds().pad(0.1));
      
      ${animated ? `
      // アニメーション効果（オプション）
      window.currentRoute.setStyle({opacity: 0});
      var opacity = 0;
      var fadeIn = setInterval(function() {
        opacity += 0.1;
        window.currentRoute.setStyle({opacity: opacity});
        if (opacity >= 0.8) {
          clearInterval(fadeIn);
        }
      }, 50);
      ` : ''}
    `;
  };

  // このコンポーネントは主にデータ提供用
  // 実際の描画はWebViewの地図で行われる
  return (
    <View style={[styles.container, style]}>
      {/* Script injection is handled by the parent WebView component directly */}
      {/* No need for HTML script elements in React Native JSX */}
    </View>
  );
};

// コンポーネントの静的メソッドとして、ルートデータを取得
RouteOverlay.calculateRoute = async (
  from: {latitude: number; longitude: number},
  to: {latitude: number; longitude: number},
  routeType: 'taxi' | 'ship' | 'walking' = 'taxi'
): Promise<RouteData | null> => {
  try {
    const profile = routeType === 'walking' ? 'foot' : 'driving';
    const coordinatesString = `${from.longitude},${from.latitude};${to.longitude},${to.latitude}`;
    
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/${profile}/${coordinatesString}?overview=full&geometries=geojson`
    );
    
    if (!response.ok) throw new Error('Route calculation failed');
    
    const data = await response.json();
    if (!data.routes || data.routes.length === 0) return null;
    
    const route = data.routes[0];
    
    return {
      coordinates: route.geometry.coordinates.map((coord: [number, number]) => ({
        longitude: coord[0],
        latitude: coord[1],
      })),
      distance: Math.round((route.distance / 1000) * 10) / 10,
      duration: Math.round(route.duration / 60),
    };
  } catch (error) {
    console.error('Static route calculation failed:', error);
    return null;
  }
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none', // タッチイベントを通す
  },
});