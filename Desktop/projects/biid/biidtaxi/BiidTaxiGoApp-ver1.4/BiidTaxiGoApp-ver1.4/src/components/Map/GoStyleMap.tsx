import React from 'react';
import {View, Text, StyleSheet, ViewStyle} from 'react-native';
import {LeafletMap, MapMarker} from './LeafletMap';
import {GoCard} from '../GoStyle';
import {GoTheme} from '../../theme/GoTheme';

export interface GoStyleMapProps {
  pickup?: {latitude: number; longitude: number; address?: string};
  destination?: {latitude: number; longitude: number; address?: string};
  route?: {coordinates: [number, number][]; color?: string};
  fare?: number;
  eta?: number;
  onMapPress?: (data: {latitude: number; longitude: number}) => void;
  onMarkerPress?: (marker: MapMarker) => void;
  onMoveStart?: () => void;
  onMoveEnd?: () => void;
  style?: ViewStyle;
}

export const GoStyleMap: React.FC<GoStyleMapProps> = ({
  pickup,
  destination,
  route,
  fare,
  eta,
  onMapPress,
  onMarkerPress,
  onMoveStart,
  onMoveEnd,
  style,
}) => {
  // マーカー配列の生成
  const markers: MapMarker[] = [];
  
  if (pickup) {
    markers.push({
      latitude: pickup.latitude,
      longitude: pickup.longitude,
      type: 'pickup',
      title: 'お迎え地点',
      description: pickup.address,
    });
  }
  
  if (destination) {
    markers.push({
      latitude: destination.latitude,
      longitude: destination.longitude,
      type: 'destination',
      title: '目的地',
      description: destination.address,
    });
  }

  // 地図の中心点を計算
  const centerLat = pickup ? pickup.latitude : 35.6762;
  const centerLng = pickup ? pickup.longitude : 139.6503;

  return (
    <View style={[styles.container, style]}>
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
      
      {/* Leaflet地図 */}
      <LeafletMap
        latitude={centerLat}
        longitude={centerLng}
        markers={markers}
        route={route}
        onMapPress={onMapPress}
        onMarkerPress={onMarkerPress}
        onMoveStart={onMoveStart}
        onMoveEnd={onMoveEnd}
        zoom={16}
        style={styles.map}
      />
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