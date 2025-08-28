import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { GoCard } from '../../components/GoStyle/GoCard';
import { GoButton } from '../../components/GoStyle/GoButton';
import { TaxiBooking, ShipBooking } from '../../services/api/types';
import { authService } from '../../services/api/authService';

interface BookingHistoryTabProps {
  currentMode: 'taxi' | 'ship';
}

type BookingItem = (TaxiBooking | ShipBooking) & {
  type: 'taxi' | 'ship';
  formattedDate: string;
  formattedTime: string;
};

export const BookingHistoryTab: React.FC<BookingHistoryTabProps> = ({ currentMode }) => {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBookingHistory();
  }, [currentMode]);

  const loadBookingHistory = async () => {
    try {
      setIsLoading(true);
      
      // モックデータ - 実際のAPI実装時に置き換え
      const mockTaxiBookings: BookingItem[] = [
        {
          id: 'taxi_001',
          user_id: 'user_1',
          type: 'taxi',
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
          status: 'completed',
          fare: 1200,
          eta: 15,
          driver: {
            id: 'driver_1',
            name: '田中太郎',
            rating: 4.8,
            vehicle_model: 'トヨタ プリウス',
            plate_number: '品川 500 あ 1234',
            phone: '090-1234-5678',
            status: 'available'
          },
          created_at: '2024-01-15T10:30:00Z',
          updated_at: '2024-01-15T11:00:00Z',
          formattedDate: '2024年1月15日',
          formattedTime: '10:30'
        },
        {
          id: 'taxi_002',
          user_id: 'user_1',
          type: 'taxi',
          pickup: {
            latitude: 35.6586,
            longitude: 139.7454,
            address: '新宿駅'
          },
          destination: {
            latitude: 35.6812,
            longitude: 139.7671,
            address: '池袋駅'
          },
          matching_type: 'auto',
          vehicle_type: 'premium',
          status: 'completed',
          fare: 800,
          eta: 12,
          created_at: '2024-01-14T15:45:00Z',
          updated_at: '2024-01-14T16:15:00Z',
          formattedDate: '2024年1月14日',
          formattedTime: '15:45'
        }
      ];

      const mockShipBookings: BookingItem[] = [
        {
          id: 'ship_001',
          userId: 'user_1',
          type: 'ship',
          scheduleId: 'schedule_1',
          schedule: {
            id: 'schedule_1',
            departurePortId: 'port_tokyo',
            arrivalPortId: 'port_oshima',
            departureTime: '2024-01-13T08:00:00Z',
            arrivalTime: '2024-01-13T10:00:00Z',
            vesselType: 'jetfoil',
            fare: 3500,
            availableSeats: 120,
            duration: 120
          },
          passengers: 2,
          status: 'completed',
          fare: 7000,
          bookingReference: 'SHIP001',
          createdAt: '2024-01-13T08:00:00Z',
          formattedDate: '2024年1月13日',
          formattedTime: '08:00'
        }
      ];

      // 現在のモードに応じてデータを設定
      const filteredBookings = currentMode === 'taxi' ? mockTaxiBookings : mockShipBookings;
      setBookings(filteredBookings);

    } catch (error) {
      console.error('Failed to load booking history:', error);
      Alert.alert('エラー', '予約履歴の読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookingHistory();
    setRefreshing(false);
  };

  const handleRebooking = (booking: BookingItem) => {
    Alert.alert(
      '再予約',
      '同じ条件で再予約しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '再予約',
          onPress: () => {
            // 実際の再予約処理をここに実装
            Alert.alert('再予約', '再予約処理を開始します');
          }
        }
      ]
    );
  };

  const handleReceiptView = (booking: BookingItem) => {
    Alert.alert('領収書', `予約ID: ${booking.id}\n料金: ¥${booking.fare}\n\n詳細な領収書を表示します`);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return '#059669';
      case 'cancelled': return '#ef4444';
      case 'pending': return '#fbbf24';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'completed': return '完了';
      case 'cancelled': return 'キャンセル';
      case 'pending': return '進行中';
      case 'confirmed': return '確定';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </View>
    );
  }

  if (bookings.length === 0) {
    return (
      <View style={styles.container}>
        <GoCard style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>
            {currentMode === 'taxi' ? 'タクシー' : '船舶'}の予約履歴はありません
          </Text>
          <Text style={styles.emptySubtitle}>
            初回予約後にこちらに履歴が表示されます
          </Text>
        </GoCard>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {bookings.map((booking) => (
        <GoCard key={booking.id} style={styles.bookingCard}>
          <View style={styles.bookingHeader}>
            <View style={styles.bookingInfo}>
              <Text style={styles.bookingDate}>{booking.formattedDate}</Text>
              <Text style={styles.bookingTime}>{booking.formattedTime}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
              <Text style={styles.statusText}>{getStatusText(booking.status)}</Text>
            </View>
          </View>

          {/* タクシー予約の場合 */}
          {booking.type === 'taxi' && 'pickup' in booking && (
            <View style={styles.routeInfo}>
              <View style={styles.routeItem}>
                <View style={[styles.routeIcon, styles.pickupIcon]} />
                <Text style={styles.routeText}>{booking.pickup.address}</Text>
              </View>
              {booking.destination && (
                <View style={styles.routeItem}>
                  <View style={[styles.routeIcon, styles.destinationIcon]} />
                  <Text style={styles.routeText}>{booking.destination.address}</Text>
                </View>
              )}
              {booking.driver && (
                <Text style={styles.driverInfo}>
                  ドライバー: {booking.driver.name} ({booking.driver.vehicle_model})
                </Text>
              )}
            </View>
          )}

          {/* 船舶予約の場合 */}
          {booking.type === 'ship' && 'schedule' in booking && (
            <View style={styles.routeInfo}>
              <Text style={styles.shipRoute}>
                出発港 → 到着港
              </Text>
              <Text style={styles.shipDetails}>
                {booking.schedule.vesselType === 'jetfoil' ? 'ジェットフォイル' : 'フェリー'} • 
                乗船者数: {booking.passengers}名
              </Text>
              <Text style={styles.bookingReference}>
                予約番号: {booking.bookingReference}
              </Text>
            </View>
          )}

          <View style={styles.bookingFooter}>
            <Text style={styles.fareText}>¥{booking.fare.toLocaleString()}</Text>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleReceiptView(booking)}
              >
                <Text style={styles.actionButtonText}>領収書</Text>
              </TouchableOpacity>
              
              {booking.status === 'completed' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.rebookButton]}
                  onPress={() => handleRebooking(booking)}
                >
                  <Text style={styles.rebookButtonText}>再予約</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </GoCard>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
  bookingCard: {
    margin: 20,
    marginBottom: 12,
    padding: 16,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  bookingTime: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  routeInfo: {
    marginBottom: 16,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  routeIcon: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  pickupIcon: {
    backgroundColor: '#10b981',
  },
  destinationIcon: {
    backgroundColor: '#ef4444',
  },
  routeText: {
    fontSize: 14,
    color: '#1f2937',
  },
  driverInfo: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  shipRoute: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  shipDetails: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  bookingReference: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  fareText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  rebookButton: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  rebookButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});