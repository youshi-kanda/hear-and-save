import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
  Alert,
  PermissionsAndroid,
  Platform,
  Text,
} from 'react-native';
import MapView, { 
  Marker, 
  PROVIDER_GOOGLE, 
  Region, 
  LatLng,
  MarkerDragEvent 
} from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import {GoCard} from '../GoStyle';
import {GoTheme} from '../../theme/GoTheme';
import {CustomMarker, UserLocationMarker} from './CustomMarkers';
import {GoogleRouteOverlay} from './GoogleRouteOverlay';

const { width, height } = Dimensions.get('window');


interface GoogleMapViewProps {
  pickup?: {latitude: number; longitude: number; address?: string};
  destination?: {latitude: number; longitude: number; address?: string};
  route?: {coordinates: [number, number][]; color?: string};
  fare?: number;
  eta?: number;
  onLocationSelect?: (location: LatLng) => void;
  onMapPress?: (data: {latitude: number; longitude: number}) => void;
  onMarkerPress?: (marker: any) => void;
  onMoveStart?: () => void;
  onMoveEnd?: () => void;
  onRouteCalculated?: (distance: number, duration: number) => void;
  markers?: Array<{
    id: string;
    coordinate: LatLng;
    title?: string;
    description?: string;
    pinColor?: string;
  }>;
  showUserLocation?: boolean;
  followUserLocation?: boolean;
  showRoute?: boolean;
  routeType?: 'taxi' | 'ship' | 'walking';
  initialRegion?: Region;
}

export const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  pickup,
  destination,
  route,
  fare,
  eta,
  onLocationSelect,
  onMapPress,
  onMarkerPress,
  onMoveStart,
  onMoveEnd,
  onRouteCalculated,
  markers = [],
  showUserLocation = true,
  followUserLocation = true,
  showRoute = true,
  routeType = 'taxi',
  initialRegion,
}) => {
  const mapRef = useRef<MapView>(null);
  const initialMapRegion = useMemo(() => 
    initialRegion || {
      latitude: pickup ? pickup.latitude : 35.6762, // 東京駅周辺（GOタクシー標準位置）
      longitude: pickup ? pickup.longitude : 139.6503,
      latitudeDelta: 0.002, // GO仕様: Zoom Level 17-18相当の詳細表示
      longitudeDelta: 0.002, // GO仕様: Zoom Level 17-18相当の詳細表示
    }, [initialRegion, pickup]
  );
  
  const [region, setRegion] = useState<Region>(initialMapRegion);

  // マーカー配列の生成（パフォーマンス最適化: useMemo使用）
  const goMarkers = useMemo(() => {
    const markers_arr: Array<{
      id: string;
      coordinate: LatLng;
      title?: string;
      description?: string;
      pinColor?: string;
    }> = [...markers];
    
    if (pickup) {
      markers_arr.push({
        id: 'pickup',
        coordinate: { latitude: pickup.latitude, longitude: pickup.longitude },
        title: 'お迎え地点',
        description: pickup.address,
        pinColor: GoTheme.colors.secondary, // GOブルー
      });
    }
    
    if (destination) {
      markers_arr.push({
        id: 'destination',
        coordinate: { latitude: destination.latitude, longitude: destination.longitude },
        title: '目的地',
        description: destination.address,
        pinColor: GoTheme.colors.success, // GO緑
      });
    }
    
    return markers_arr;
  }, [pickup, destination, markers]);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  // 位置情報権限の確認と取得
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: '位置情報の使用許可',
            message: 'タクシーの予約に位置情報が必要です',
            buttonNeutral: '後で決める',
            buttonNegative: 'キャンセル',
            buttonPositive: '許可',
          }
        );
        const hasPermission = granted === PermissionsAndroid.RESULTS.GRANTED;
        setHasLocationPermission(hasPermission);
        return hasPermission;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true; // iOS の場合は Info.plist で設定
  };

  // 現在位置の取得
  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLocation = { latitude, longitude };
        
        setUserLocation(newLocation);
        
        if (followUserLocation) {
          const newRegion = {
            latitude,
            longitude,
            latitudeDelta: 0.002, // GO仕様: Zoom Level 17-18相当の詳細表示
            longitudeDelta: 0.002, // GO仕様: Zoom Level 17-18相当の詳細表示
          };
          setRegion(newRegion);
          mapRef.current?.animateToRegion(newRegion, 1500); // GO仕様: よりスムーズなアニメーション
        }
      },
      (error) => {
        console.error('位置情報取得エラー:', error);
        Alert.alert(
          '位置情報エラー', 
          '現在位置を取得できませんでした。GPS設定を確認してください。'
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  };

  // 初期化処理
  useEffect(() => {
    const initializeLocation = async () => {
      const hasPermission = await requestLocationPermission();
      if (hasPermission && showUserLocation) {
        getCurrentLocation();
      }
    };
    
    initializeLocation();
  }, [showUserLocation]);

  // マップタップ処理（パフォーマンス最適化: useCallback使用）
  const handleMapPress = useCallback((event: any) => {
    const { coordinate } = event.nativeEvent;
    onLocationSelect?.(coordinate);
    onMapPress?.({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    });
  }, [onLocationSelect, onMapPress]);

  // マーカードラッグ処理（パフォーマンス最適化: useCallback使用）
  const handleMarkerDragEnd = useCallback((event: MarkerDragEvent, markerId: string) => {
    const { coordinate } = event.nativeEvent;
    onLocationSelect?.(coordinate);
  }, [onLocationSelect]);

  // 現在地に移動（パフォーマンス最適化: useCallback使用）
  const moveToCurrentLocation = useCallback(() => {
    if (hasLocationPermission) {
      getCurrentLocation();
    } else {
      requestLocationPermission().then((granted) => {
        if (granted) {
          getCurrentLocation();
        }
      });
    }
  }, [hasLocationPermission]);

  return (
    <View style={styles.container}>
      {/* 料金表示カード（左上） */}
      {fare && (
        <GoCard style={styles.fareCard} padding="sm" shadow>
          <Text style={styles.fareAmount}>¥{fare.toLocaleString()}</Text>
          <Text style={styles.fareLabel}>予想料金</Text>
        </GoCard>
      )}
      
      {/* 到着時間表示カード（右上） */}
      {eta && (
        <GoCard style={styles.etaCard} padding="sm" shadow>
          <Text style={styles.etaTime}>{eta}分</Text>
          <Text style={styles.etaLabel}>{`約${eta}分`}</Text>
        </GoCard>
      )}

      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialMapRegion}
        onRegionChange={onMoveStart}
        onRegionChangeComplete={useCallback((newRegion: Region) => {
          // 無限ループ防止：大幅な変更のみ更新
          const isSignificantChange = 
            Math.abs(newRegion.latitude - region.latitude) > 0.0001 ||
            Math.abs(newRegion.longitude - region.longitude) > 0.0001 ||
            Math.abs(newRegion.latitudeDelta - region.latitudeDelta) > 0.0001 ||
            Math.abs(newRegion.longitudeDelta - region.longitudeDelta) > 0.0001;
          
          if (isSignificantChange) {
            setRegion(newRegion);
          }
          onMoveEnd?.();
        }, [region, onMoveEnd])}
        onPress={handleMapPress}
        showsUserLocation={showUserLocation && hasLocationPermission}
        showsMyLocationButton={false} // カスタムボタンを使用
        showsCompass={false} // パフォーマンス最適化: コンパス無効
        showsScale={true} // GO仕様: スケール表示を有効化
        mapType="standard"
        loadingEnabled={true}
        loadingIndicatorColor={GoTheme.colors.primary}
        loadingBackgroundColor={GoTheme.colors.surface}
        pitchEnabled={false} // パフォーマンス最適化: 3D無効
        rotateEnabled={false} // パフォーマンス最適化: 回転無効
        scrollEnabled={true}
        zoomEnabled={true}
        toolbarEnabled={false} // Android最適化
        moveOnMarkerPress={false} // マーカー押下時の移動無効
        showsIndoors={false} // 屋内マップ無効
        showsBuildings={true} // GO仕様: 建物表示で詳細度向上
        showsTraffic={false} // 交通情報無効（必要に応じて有効化）
        showsPointsOfInterest={true} // GO仕様: ランドマーク表示
        maxZoomLevel={20} // GO仕様: より詳細なズームを許可
        minZoomLevel={12} // GO仕様: 最小ズームを上げて詳細表示優先
      >
        {/* GOマーカー（CustomMarkersを使用） */}
        {goMarkers.map((marker) => {
          const markerType = marker.id === 'pickup' ? 'pickup' : 
                           marker.id === 'destination' ? 'destination' : 'taxi';
          
          return (
            <CustomMarker
              key={marker.id}
              coordinate={marker.coordinate}
              type={markerType as 'pickup' | 'destination' | 'taxi'}
              title={marker.title}
              description={marker.description}
              draggable={marker.id === 'pickup' || marker.id === 'destination'}
              onPress={() => onMarkerPress?.(marker)}
            />
          );
        })}
        
        {/* ユーザー位置マーカー（CustomMarkers使用） */}
        {userLocation && showUserLocation && (
          <UserLocationMarker coordinate={userLocation} />
        )}

        {/* ルート表示（GoogleRouteOverlay使用） */}
        {showRoute && pickup && destination && (
          <GoogleRouteOverlay
            fromLocation={pickup}
            toLocation={destination}
            routeType={routeType}
            onRouteCalculated={onRouteCalculated}
          />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GoTheme.colors.background,
  },
  map: {
    flex: 1,
  },
  fareCard: {
    position: 'absolute',
    top: 60,
    left: 16,
    zIndex: 1000,
    minWidth: 80,
  },
  fareAmount: {
    ...GoTheme.typography.h4,
    color: GoTheme.colors.primary,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  fareLabel: {
    ...GoTheme.typography.caption,
    color: GoTheme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  etaCard: {
    position: 'absolute',
    top: 60,
    right: 16,
    zIndex: 1000,
    minWidth: 60,
  },
  etaTime: {
    ...GoTheme.typography.h4,
    color: GoTheme.colors.success,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  etaLabel: {
    ...GoTheme.typography.caption,
    color: GoTheme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
});

export default GoogleMapView;