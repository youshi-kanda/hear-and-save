import React, { useState, useEffect } from 'react';
import { Polyline } from 'react-native-maps';
import { GoTheme } from '../../theme/GoTheme';

export interface GoogleRouteOverlayProps {
  fromLocation?: { latitude: number; longitude: number };
  toLocation?: { latitude: number; longitude: number };
  waypoints?: Array<{ latitude: number; longitude: number; name?: string }>;
  routeType?: 'taxi' | 'ship' | 'walking';
  routeColor?: string;
  routeWidth?: number;
  onRouteCalculated?: (distance: number, duration: number) => void;
}

interface RouteData {
  coordinates: Array<{ latitude: number; longitude: number }>;
  distance: number; // km
  duration: number; // minutes
}

/**
 * GoogleRouteOverlay: Google Maps Directions APIを使用したルート表示
 * react-native-mapsのPolylineコンポーネントでルートを描画
 */
export const GoogleRouteOverlay: React.FC<GoogleRouteOverlayProps> = ({
  fromLocation,
  toLocation,
  waypoints = [],
  routeType = 'taxi',
  routeColor,
  routeWidth = 4,
  onRouteCalculated,
}) => {
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // ルートカラーを決定（GO仕様）
  const getRouteColor = (): string => {
    if (routeColor) return routeColor;
    
    switch (routeType) {
      case 'ship':
        return GoTheme.colors.info; // 青系（船舶）
      case 'walking':
        return GoTheme.colors.success; // 緑系（徒歩）
      case 'taxi':
      default:
        return GoTheme.colors.secondary; // GOブルー（タクシー）
    }
  };

  // Google Maps Directions APIを使用したルート計算
  const calculateRouteWithGoogle = async (
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number }
  ): Promise<RouteData> => {
    try {
      // 移動手段の決定
      const travelMode = routeType === 'walking' ? 'WALKING' : 'DRIVING';
      
      // 中間ポイントの処理
      const waypointsParam = waypoints.length > 0 
        ? `&waypoints=${waypoints.map(wp => `${wp.latitude},${wp.longitude}`).join('|')}`
        : '';

      // Google Maps Directions API エンドポイント
      // 注意: 実際のAPIキーが必要
      const apiKey = 'AIzaSyDb-D_sa8VA7ZcNgOCm7G_nmFRP8eQqF_0';
      const url = `https://maps.googleapis.com/maps/api/directions/json?` +
        `origin=${from.latitude},${from.longitude}` +
        `&destination=${to.latitude},${to.longitude}` +
        `${waypointsParam}` +
        `&mode=${travelMode}` +
        `&language=ja` +
        `&region=JP` +
        `&key=${apiKey}`;
      
      console.log('Google Directions API request:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Google Directions API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status !== 'OK' || !data.routes || data.routes.length === 0) {
        throw new Error(`No route found: ${data.status}`);
      }
      
      const route = data.routes[0];
      const leg = route.legs[0];
      
      // ポリラインをデコードして座標配列に変換
      const coordinates = decodePolyline(route.overview_polyline.points);
      
      return {
        coordinates,
        distance: Math.round((leg.distance.value / 1000) * 10) / 10, // メートルをkmに変換
        duration: Math.round(leg.duration.value / 60), // 秒を分に変換
      };
      
    } catch (error) {
      console.error('Google Directions API failed:', error);
      // フォールバック: OSRM
      return calculateRouteWithOSRM(from, to);
    }
  };

  // フォールバック: OSRM (Open Source Routing Machine)
  const calculateRouteWithOSRM = async (
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number }
  ): Promise<RouteData> => {
    try {
      const profile = routeType === 'walking' ? 'foot' : 'driving';
      
      const coordinates = [from, ...waypoints, to];
      const coordinatesString = coordinates
        .map(coord => `${coord.longitude},${coord.latitude}`)
        .join(';');

      const url = `https://router.project-osrm.org/route/v1/${profile}/${coordinatesString}?overview=full&geometries=geojson`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`OSRM API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.routes || data.routes.length === 0) {
        throw new Error('No route found');
      }
      
      const route = data.routes[0];
      
      const routeCoordinates = route.geometry.coordinates.map((coord: [number, number]) => ({
        longitude: coord[0],
        latitude: coord[1],
      }));
      
      return {
        coordinates: routeCoordinates,
        distance: Math.round((route.distance / 1000) * 10) / 10,
        duration: Math.round(route.duration / 60),
      };
      
    } catch (error) {
      console.error('OSRM route calculation failed:', error);
      // 最終フォールバック: 直線ルート
      return calculateStraightLineRoute(from, to);
    }
  };

  // 直線ルートのフォールバック
  const calculateStraightLineRoute = (
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number }
  ): RouteData => {
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
    
    const avgSpeed = routeType === 'ship' ? 25 : routeType === 'walking' ? 5 : 30;
    const estimatedDuration = Math.round((distance / avgSpeed) * 60);
    
    return {
      coordinates: [from, to],
      distance: Math.round(distance * 10) / 10,
      duration: estimatedDuration,
    };
  };

  // ポリラインデコード（Google Maps API用）
  const decodePolyline = (encoded: string): Array<{ latitude: number; longitude: number }> => {
    const points: Array<{ latitude: number; longitude: number }> = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b: number;
      let shift = 0;
      let result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return points;
  };

  // ルート計算実行
  const calculateRoute = async () => {
    if (!fromLocation || !toLocation) return;
    
    setIsCalculating(true);
    setError(null);
    
    try {
      const route = await calculateRouteWithGoogle(fromLocation, toLocation);
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

  // ルートデータがある場合のみPolylineを描画
  if (!routeData || !routeData.coordinates || routeData.coordinates.length < 2) {
    return null;
  }

  return (
    <Polyline
      coordinates={routeData.coordinates}
      strokeColor={getRouteColor()}
      strokeWidth={routeWidth}
      strokePattern={routeType === 'walking' ? [1, 10] : undefined} // 徒歩の場合は点線
      lineCap="round"
      lineJoin="round"
    />
  );
};

// 静的メソッド: 外部からルート計算を実行
GoogleRouteOverlay.calculateRoute = async (
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
  routeType: 'taxi' | 'ship' | 'walking' = 'taxi'
): Promise<RouteData | null> => {
  try {
    const travelMode = routeType === 'walking' ? 'WALKING' : 'DRIVING';
    const apiKey = 'AIzaSyDb-D_sa8VA7ZcNgOCm7G_nmFRP8eQqF_0';
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?` +
      `origin=${from.latitude},${from.longitude}` +
      `&destination=${to.latitude},${to.longitude}` +
      `&mode=${travelMode}` +
      `&language=ja` +
      `&region=JP` +
      `&key=${apiKey}`
    );
    
    if (!response.ok) throw new Error('Route calculation failed');
    
    const data = await response.json();
    if (data.status !== 'OK' || !data.routes || data.routes.length === 0) return null;
    
    const route = data.routes[0];
    const leg = route.legs[0];
    
    // ポリラインデコード処理を外部関数として分離
    const decodePolyline = (encoded: string) => {
      const points: Array<{ latitude: number; longitude: number }> = [];
      let index = 0;
      const len = encoded.length;
      let lat = 0;
      let lng = 0;

      while (index < len) {
        let b: number;
        let shift = 0;
        let result = 0;

        do {
          b = encoded.charCodeAt(index++) - 63;
          result |= (b & 0x1f) << shift;
          shift += 5;
        } while (b >= 0x20);

        const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
        lat += dlat;

        shift = 0;
        result = 0;

        do {
          b = encoded.charCodeAt(index++) - 63;
          result |= (b & 0x1f) << shift;
          shift += 5;
        } while (b >= 0x20);

        const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
        lng += dlng;

        points.push({
          latitude: lat / 1e5,
          longitude: lng / 1e5,
        });
      }

      return points;
    };
    
    return {
      coordinates: decodePolyline(route.overview_polyline.points),
      distance: Math.round((leg.distance.value / 1000) * 10) / 10,
      duration: Math.round(leg.duration.value / 60),
    };
  } catch (error) {
    console.error('Static route calculation failed:', error);
    return null;
  }
};

export default GoogleRouteOverlay;