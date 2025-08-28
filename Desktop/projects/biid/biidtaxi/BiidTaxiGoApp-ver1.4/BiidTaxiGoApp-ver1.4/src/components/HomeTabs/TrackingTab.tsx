import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { GoStyleMap } from '../Map/GoStyleMap';
import { GoCard } from '../GoStyle/GoCard';
import { GoButton } from '../GoStyle/GoButton';
import { useTheme } from '../../contexts/ThemeContext';
import { logger } from '../../config/environment';

const { width: screenWidth } = Dimensions.get('window');

interface TrackingTabProps {
  currentMode: 'taxi' | 'ship';
}

interface ActiveBooking {
  id: string;
  type: 'taxi' | 'ship';
  status: 'searching' | 'confirmed' | 'arriving' | 'onboard' | 'completed';
  driverName?: string;
  vehicleInfo?: string;
  estimatedArrival?: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  pickup: {
    latitude: number;
    longitude: number;
    address: string;
  };
  destination?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  price?: number;
}

export const TrackingTab: React.FC<TrackingTabProps> = ({ currentMode }) => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  
  const [activeBooking, setActiveBooking] = useState<ActiveBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadActiveBooking();
  }, [currentMode]);

  const loadActiveBooking = async () => {
    setIsLoading(true);
    try {
      logger.log('Loading active booking for mode:', currentMode);
      
      // モックデータ（通常は進行中の予約がない場合が多い）
      const mockActiveBooking: ActiveBooking | null = Math.random() > 0.7 ? {
        id: currentMode === 'taxi' ? 'tx_active_001' : 'sp_active_001',
        type: currentMode,
        status: 'arriving',
        driverName: currentMode === 'taxi' ? '田中 太郎' : '海運 一郎',
        vehicleInfo: currentMode === 'taxi' ? '黒のプリウス 大阪 300 あ 1234' : 'マリンライナー号',
        estimatedArrival: '約3分',
        currentLocation: {
          latitude: 34.6890,
          longitude: 135.5140,
        },
        pickup: {
          latitude: 34.6851,
          longitude: 135.5136,
          address: '大阪市中央区南船場4丁目5-10',
        },
        destination: {
          latitude: 34.6937,
          longitude: 135.5023,
          address: '大阪駅',
        },
        price: currentMode === 'taxi' ? 1200 : 800,
      } : null;
      
      await new Promise(resolve => setTimeout(resolve, 500));
      setActiveBooking(mockActiveBooking);
      
    } catch (error) {
      logger.error('Failed to load active booking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCallDriver = () => {
    Alert.alert(
      currentMode === 'taxi' ? 'ドライバーに電話' : '船員に電話',
      `${activeBooking?.driverName}さんに電話をかけますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '電話をかける', onPress: () => {
          // TODO: 実際の電話機能
          Alert.alert('電話', '電話機能を実装中です');
        }},
      ]
    );
  };

  const handleCancelBooking = () => {
    Alert.alert(
      '予約のキャンセル',
      '現在の予約をキャンセルしますか？',
      [
        { text: 'いいえ', style: 'cancel' },
        { 
          text: 'キャンセル', 
          style: 'destructive',
          onPress: () => {
            setActiveBooking(null);
            Alert.alert('キャンセル完了', '予約がキャンセルされました');
          }
        },
      ]
    );
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'searching': return currentMode === 'taxi' ? 'ドライバーを検索中' : '船舶を検索中';
      case 'confirmed': return currentMode === 'taxi' ? 'ドライバーが確定しました' : '船舶が確定しました';
      case 'arriving': return currentMode === 'taxi' ? 'ドライバーが向かっています' : '船舶が向かっています';
      case 'onboard': return currentMode === 'taxi' ? '乗車中' : '乗船中';
      case 'completed': return '完了';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'searching': return '#f59e0b';
      case 'confirmed': return '#10b981';
      case 'arriving': return '#3b82f6';
      case 'onboard': return '#8b5cf6';
      case 'completed': return '#10b981';
      default: return '#6b7280';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>追跡情報を読み込み中...</Text>
      </View>
    );
  }

  if (!activeBooking) {
    return (
      <ScrollView style={styles.container}>
        <GoCard style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>
            {currentMode === 'taxi' ? '🚗' : '🚢'}
          </Text>
          <Text style={styles.emptyTitle}>進行中の予約がありません</Text>
          <Text style={styles.emptySubtitle}>
            {currentMode === 'taxi' ? 'タクシーを呼んで' : '船舶を予約して'}移動を開始しましょう
          </Text>
        </GoCard>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      {/* 地図エリア */}
      <View style={styles.mapContainer}>
        <GoStyleMap
          initialLocation={activeBooking.pickup}
          style={styles.map}
          showUserLocation={true}
          mode={currentMode}
        />
        
        {/* ステータスカード */}
        <View style={styles.statusCardContainer}>
          <GoCard style={styles.statusCard}>
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(activeBooking.status) }
            ]}>
              <Text style={styles.statusText}>
                {getStatusText(activeBooking.status)}
              </Text>
            </View>
            {activeBooking.estimatedArrival && (
              <Text style={styles.estimatedTime}>
                {activeBooking.estimatedArrival}で到着予定
              </Text>
            )}
          </GoCard>
        </View>
      </View>

      {/* ドライバー情報カード */}
      <View style={styles.bottomInfo}>
        <GoCard style={styles.driverCard}>
          <View style={styles.driverHeader}>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{activeBooking.driverName}</Text>
              <Text style={styles.vehicleInfo}>{activeBooking.vehicleInfo}</Text>
            </View>
            <TouchableOpacity 
              style={styles.callButton}
              onPress={handleCallDriver}
            >
              <Text style={styles.callIcon}>📞</Text>
            </TouchableOpacity>
          </View>

          {/* ルート情報 */}
          <View style={styles.routeContainer}>
            <View style={styles.routePoint}>
              <Text style={styles.routeIcon}>📍</Text>
              <Text style={styles.routeText}>{activeBooking.pickup.address}</Text>
            </View>
            {activeBooking.destination && (
              <>
                <View style={styles.routeLine} />
                <View style={styles.routePoint}>
                  <Text style={styles.routeIcon}>🎯</Text>
                  <Text style={styles.routeText}>{activeBooking.destination.address}</Text>
                </View>
              </>
            )}
          </View>

          {/* 料金情報 */}
          {activeBooking.price && (
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>予想料金</Text>
              <Text style={styles.priceValue}>¥{activeBooking.price.toLocaleString()}</Text>
            </View>
          )}

          {/* アクションボタン */}
          <View style={styles.actionContainer}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleCancelBooking}
            >
              <Text style={styles.cancelButtonText}>キャンセル</Text>
            </TouchableOpacity>
            <GoButton
              title="詳細追跡"
              onPress={() => {
                if (currentMode === 'taxi') {
                  navigation.navigate('TaxiTracking', { bookingId: activeBooking.id });
                } else {
                  navigation.navigate('ShipTracking', { bookingId: activeBooking.id });
                }
              }}
              style={[styles.trackingButton, { backgroundColor: colors.primary }]}
              textStyle={styles.trackingButtonText}
            />
          </View>
        </GoCard>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  statusCardContainer: {
    position: 'absolute',
    top: 20,
    left: 16,
    right: 16,
    zIndex: 1,
  },
  statusCard: {
    padding: 16,
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  estimatedTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
  },

  // 空の状態
  emptyCard: {
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
    margin: 16,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },

  // ドライバー情報
  bottomInfo: {
    padding: 16,
  },
  driverCard: {
    padding: 16,
  },
  driverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  vehicleInfo: {
    fontSize: 14,
    color: '#6b7280',
  },
  callButton: {
    backgroundColor: '#10b981',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callIcon: {
    fontSize: 20,
  },

  // ルート情報
  routeContainer: {
    marginBottom: 16,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  routeIcon: {
    fontSize: 16,
    marginRight: 12,
    width: 20,
  },
  routeText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#d1d5db',
    marginLeft: 9,
    marginVertical: 4,
  },

  // 料金情報
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginBottom: 16,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
  },

  // アクション
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ef4444',
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  trackingButton: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 12,
    marginLeft: 8,
  },
  trackingButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default TrackingTab;