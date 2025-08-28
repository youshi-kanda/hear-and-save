import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { GoCard } from '../../components/GoStyle/GoCard';
import { GoButton } from '../../components/GoStyle/GoButton';
import { GoStyleMap } from '../../components/Map/GoStyleMap';
import { useWebSocket } from '../../services/websocket/websocketService';
import { TaxiBooking, ShipBooking, Location } from '../../services/api/types';

interface TrackingTabProps {
  currentMode: 'taxi' | 'ship';
}

export const TrackingTab: React.FC<TrackingTabProps> = ({ currentMode }) => {
  const [activeRide, setActiveRide] = useState<TaxiBooking | ShipBooking | null>(null);
  const [driverLocation, setDriverLocation] = useState<Location | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [eta, setEta] = useState<number | null>(null);

  const {
    subscribeToRideTracking,
    subscribeToShipTracking,
    unsubscribeFromRideTracking,
    unsubscribeFromShipTracking,
    setEventHandlers,
    getConnectionState,
    sendEmergencyAlert,
  } = useWebSocket();

  useEffect(() => {
    // WebSocket イベントハンドラーを設定
    setEventHandlers({
      onTaxiUpdate: (update) => {
        if (currentMode === 'taxi') {
          if (update.driver_location) {
            setDriverLocation(update.driver_location);
          }
          if (update.eta) {
            setEta(update.eta);
          }
        }
      },
      onShipUpdate: (update) => {
        if (currentMode === 'ship') {
          if (update.vessel_location) {
            setDriverLocation(update.vessel_location);
          }
          if (update.eta) {
            setEta(update.eta);
          }
        }
      },
      onRideStatusUpdate: (update) => {
        console.log('Ride status update:', update);
        // ライド状況の更新処理
      },
    });

    return () => {
      // クリーンアップ
      if (isTracking) {
        if (currentMode === 'taxi') {
          unsubscribeFromRideTracking();
        } else {
          unsubscribeFromShipTracking();
        }
      }
    };
  }, [currentMode, isTracking]);

  const startTracking = async (rideId: string) => {
    try {
      setIsTracking(true);
      if (currentMode === 'taxi') {
        await subscribeToRideTracking(rideId);
      } else {
        await subscribeToShipTracking(rideId);
      }
    } catch (error) {
      console.error('Failed to start tracking:', error);
      Alert.alert('エラー', 'トラッキングの開始に失敗しました');
      setIsTracking(false);
    }
  };

  const stopTracking = () => {
    if (currentMode === 'taxi') {
      unsubscribeFromRideTracking();
    } else {
      unsubscribeFromShipTracking();
    }
    setIsTracking(false);
    setDriverLocation(null);
    setEta(null);
  };

  const handleEmergencyCall = () => {
    Alert.alert(
      '緊急連絡',
      '緊急時の連絡を行いますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '緊急連絡',
          style: 'destructive',
          onPress: () => {
            if (activeRide?.id) {
              sendEmergencyAlert(activeRide.id, 'user_emergency', driverLocation || undefined);
            }
            // 実際の緊急連絡処理
            Alert.alert('緊急連絡', '緊急連絡を送信しました');
          }
        }
      ]
    );
  };

  const mockActiveRide: TaxiBooking = {
    id: 'ride_123',
    user_id: 'user_1',
    pickup: {
      latitude: 35.6762,
      longitude: 139.6503,
      address: '東京駅'
    },
    destination: {
      latitude: 35.6586,
      longitude: 139.7454,
      address: '新宿駅'
    },
    matching_type: 'auto',
    vehicle_type: 'standard',
    status: 'pickup',
    fare: 1200,
    eta: 5,
    driver: {
      id: 'driver_1',
      name: '田中太郎',
      rating: 4.8,
      vehicle_model: 'トヨタ プリウス',
      plate_number: '品川 500 あ 1234',
      phone: '090-1234-5678',
      status: 'busy'
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (!activeRide && !isTracking) {
    return (
      <View style={styles.container}>
        <GoCard style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>
            {currentMode === 'taxi' ? 'アクティブなタクシー' : 'アクティブな船舶予約'}はありません
          </Text>
          <Text style={styles.emptySubtitle}>
            予約後にこちらでリアルタイム追跡ができます
          </Text>
        </GoCard>

        {/* デモ用 */}
        <GoButton
          title="デモ用トラッキングを開始"
          onPress={() => {
            setActiveRide(mockActiveRide);
            startTracking(mockActiveRide.id);
          }}
          style={styles.demoButton}
        />
      </View>
    );
  }

  const currentRide = activeRide || mockActiveRide;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* マップ表示 */}
      <View style={styles.mapContainer}>
        <GoStyleMap
          style={styles.map}
          initialRegion={{
            latitude: currentRide.pickup.latitude,
            longitude: currentRide.pickup.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          markers={[
            {
              id: 'pickup',
              coordinate: currentRide.pickup,
              title: '乗車地点',
              description: currentRide.pickup.address
            },
            ...(currentRide.destination ? [{
              id: 'destination',
              coordinate: currentRide.destination,
              title: '目的地',
              description: currentRide.destination.address
            }] : []),
            ...(driverLocation ? [{
              id: 'driver',
              coordinate: driverLocation,
              title: currentMode === 'taxi' ? 'ドライバー位置' : '船舶位置',
              description: 'リアルタイム位置'
            }] : [])
          ]}
        />
      </View>

      {/* ステータス情報 */}
      <GoCard style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusTitle}>
            {currentMode === 'taxi' ? 'タクシー' : '船舶'}追跡中
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentRide.status) }]}>
            <Text style={styles.statusBadgeText}>{getStatusText(currentRide.status)}</Text>
          </View>
        </View>

        {eta && (
          <View style={styles.etaContainer}>
            <Text style={styles.etaText}>到着予定</Text>
            <Text style={styles.etaValue}>{eta}分</Text>
          </View>
        )}

        {currentMode === 'taxi' && 'driver' in currentRide && currentRide.driver && (
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{currentRide.driver.name}</Text>
            <Text style={styles.driverDetails}>
              {currentRide.driver.vehicle_model} • {currentRide.driver.plate_number}
            </Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.rating}>★ {currentRide.driver.rating}</Text>
            </View>
          </View>
        )}
      </GoCard>

      {/* 行き先情報 */}
      <GoCard style={styles.routeCard}>
        <View style={styles.routeItem}>
          <View style={[styles.routeIcon, styles.pickupIcon]} />
          <View style={styles.routeDetails}>
            <Text style={styles.routeLabel}>乗車地点</Text>
            <Text style={styles.routeAddress}>{currentRide.pickup.address}</Text>
          </View>
        </View>

        {currentRide.destination && (
          <View style={styles.routeItem}>
            <View style={[styles.routeIcon, styles.destinationIcon]} />
            <View style={styles.routeDetails}>
              <Text style={styles.routeLabel}>目的地</Text>
              <Text style={styles.routeAddress}>{currentRide.destination.address}</Text>
            </View>
          </View>
        )}
      </GoCard>

      {/* アクションボタン */}
      <View style={styles.actionButtons}>
        {currentMode === 'taxi' && 'driver' in currentRide && currentRide.driver?.phone && (
          <GoButton
            title="ドライバーに連絡"
            onPress={() => Alert.alert('連絡', `${currentRide.driver?.phone}に発信しますか？`)}
            style={styles.actionButton}
          />
        )}

        <GoButton
          title="緊急連絡"
          onPress={handleEmergencyCall}
          style={[styles.actionButton, styles.emergencyButton]}
          textStyle={styles.emergencyButtonText}
        />

        <GoButton
          title="追跡を停止"
          onPress={() => {
            stopTracking();
            setActiveRide(null);
          }}
          style={[styles.actionButton, styles.stopButton]}
          textStyle={styles.stopButtonText}
        />
      </View>
    </ScrollView>
  );
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending': return '#fbbf24';
    case 'matched': case 'driver_assigned': return '#3b82f6';
    case 'pickup': case 'arrived': return '#10b981';
    case 'enroute': case 'in_progress': return '#8b5cf6';
    case 'completed': return '#059669';
    case 'cancelled': return '#ef4444';
    default: return '#6b7280';
  }
};

const getStatusText = (status: string): string => {
  switch (status) {
    case 'pending': return '待機中';
    case 'matched': case 'driver_assigned': return 'マッチング完了';
    case 'pickup': case 'arrived': return '到着';
    case 'enroute': case 'in_progress': return '移動中';
    case 'completed': return '完了';
    case 'cancelled': return 'キャンセル';
    default: return status;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  emptyCard: {
    margin: 20,
    padding: 30,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  demoButton: {
    margin: 20,
    backgroundColor: '#3b82f6',
  },
  mapContainer: {
    height: 200,
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  statusCard: {
    margin: 20,
    marginTop: 0,
    padding: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  etaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
  },
  etaText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  etaValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  driverInfo: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 15,
  },
  driverName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  driverDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  ratingContainer: {
    alignSelf: 'flex-start',
  },
  rating: {
    fontSize: 14,
    color: '#fbbf24',
    fontWeight: 'bold',
  },
  routeCard: {
    margin: 20,
    marginTop: 0,
    padding: 20,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  routeIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 15,
  },
  pickupIcon: {
    backgroundColor: '#10b981',
  },
  destinationIcon: {
    backgroundColor: '#ef4444',
  },
  routeDetails: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  routeAddress: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  actionButtons: {
    padding: 20,
    paddingTop: 0,
  },
  actionButton: {
    marginBottom: 12,
  },
  emergencyButton: {
    backgroundColor: '#ef4444',
  },
  emergencyButtonText: {
    color: '#ffffff',
  },
  stopButton: {
    backgroundColor: '#6b7280',
  },
  stopButtonText: {
    color: '#ffffff',
  },
});