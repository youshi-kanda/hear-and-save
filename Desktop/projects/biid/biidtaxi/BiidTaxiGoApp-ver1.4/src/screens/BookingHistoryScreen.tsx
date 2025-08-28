import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import {GoButton, GoCard, GoHeader} from '../components/GoStyle';
import {GoTheme} from '../theme/GoTheme';
import {taxiService} from '../services/api/taxiService';
import {shipService} from '../services/api/shipService';
import {ApiResponse} from '../services/api/types';

export interface BookingHistoryScreenProps {
  navigation: any;
}

interface BookingHistoryItem {
  id: string;
  type: 'taxi' | 'ship';
  status: 'completed' | 'cancelled' | 'pending' | 'in_progress';
  created_at: string;
  completed_at?: string;
  pickup?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  destination?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  departure?: {
    port: string;
    address: string;
  };
  arrival?: {
    port: string;
    address: string;
  };
  fare: number;
  driver?: {
    name: string;
    rating: number;
  };
  vessel?: {
    name: string;
    type: string;
  };
  payment_status: 'paid' | 'pending' | 'failed' | 'refunded';
  rating?: number;
  review?: string;
}

export const BookingHistoryScreen: React.FC<BookingHistoryScreenProps> = ({navigation}) => {
  const [bookings, setBookings] = useState<BookingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'taxi' | 'ship'>('all');

  useEffect(() => {
    loadBookingHistory();
  }, []);

  const loadBookingHistory = async () => {
    try {
      setLoading(true);

      // タクシー予約履歴取得
      const taxiResponse = await taxiService.getBookingHistory(20, 0);
      const taxiBookings: BookingHistoryItem[] = taxiResponse.success && taxiResponse.data 
        ? taxiResponse.data.map(booking => ({
            ...booking,
            type: 'taxi' as const,
          }))
        : [];

      // 船舶予約履歴取得
      const shipResponse = await shipService.getBookings(20, 0);
      const shipBookings: BookingHistoryItem[] = shipResponse.success && shipResponse.data
        ? shipResponse.data.map(booking => ({
            ...booking,
            type: 'ship' as const,
          }))
        : [];

      // 合併して日付順にソート
      const allBookings = [...taxiBookings, ...shipBookings].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setBookings(allBookings);
    } catch (error) {
      console.error('Failed to load booking history:', error);
      Alert.alert('エラー', '予約履歴の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBookingHistory();
    setRefreshing(false);
  }, []);

  const handleBookingPress = (booking: BookingHistoryItem) => {
    navigation.navigate('BookingDetail', {booking});
  };

  const handleRateBooking = async (bookingId: string, rating: number, review: string) => {
    try {
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) return;

      let response: ApiResponse<any>;
      if (booking.type === 'taxi') {
        response = await taxiService.rateRide(bookingId, rating, review);
      } else {
        response = await shipService.rateBooking(bookingId, rating, review);
      }

      if (response.success) {
        // ローカルデータ更新
        setBookings(prev => prev.map(b => 
          b.id === bookingId ? {...b, rating, review} : b
        ));
        Alert.alert('完了', '評価を送信しました');
      } else {
        Alert.alert('エラー', '評価の送信に失敗しました');
      }
    } catch (error) {
      console.error('Rating submission failed:', error);
      Alert.alert('エラー', '評価の送信に失敗しました');
    }
  };

  const handleCancelBooking = async (bookingId: string, reason: string) => {
    try {
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) return;

      let response: ApiResponse<any>;
      if (booking.type === 'taxi') {
        response = await taxiService.cancelRide(bookingId, reason);
      } else {
        response = await shipService.cancelBooking(bookingId, reason);
      }

      if (response.success) {
        // ローカルデータ更新
        setBookings(prev => prev.map(b => 
          b.id === bookingId ? {...b, status: 'cancelled'} : b
        ));
        Alert.alert('完了', '予約をキャンセルしました');
      } else {
        Alert.alert('エラー', 'キャンセルに失敗しました');
      }
    } catch (error) {
      console.error('Booking cancellation failed:', error);
      Alert.alert('エラー', 'キャンセルに失敗しました');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return GoTheme.colors.success;
      case 'cancelled': return GoTheme.colors.error;
      case 'in_progress': return GoTheme.colors.warning;
      case 'pending': return GoTheme.colors.textSecondary;
      default: return GoTheme.colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '完了';
      case 'cancelled': return 'キャンセル';
      case 'in_progress': return '利用中';
      case 'pending': return '予約中';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  };

  const filteredBookings = bookings.filter(booking => {
    if (selectedFilter === 'all') return true;
    return booking.type === selectedFilter;
  });

  const renderBookingItem = ({item}: {item: BookingHistoryItem}) => (
    <TouchableOpacity onPress={() => handleBookingPress(item)}>
      <GoCard style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <View style={styles.bookingType}>
            <Text style={styles.typeIcon}>
              {item.type === 'taxi' ? '🚗' : '🚢'}
            </Text>
            <Text style={styles.typeName}>
              {item.type === 'taxi' ? 'タクシー' : '船舶'}
            </Text>
          </View>
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, {backgroundColor: getStatusColor(item.status) + '20'}]}>
              <Text style={[styles.statusText, {color: getStatusColor(item.status)}]}>
                {getStatusText(item.status)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bookingDetails}>
          {item.type === 'taxi' && item.pickup && (
            <>
              <View style={styles.routeInfo}>
                <Text style={styles.routeLabel}>乗車地</Text>
                <Text style={styles.routeText} numberOfLines={1}>
                  {item.pickup.address}
                </Text>
              </View>
              {item.destination && (
                <View style={styles.routeInfo}>
                  <Text style={styles.routeLabel}>目的地</Text>
                  <Text style={styles.routeText} numberOfLines={1}>
                    {item.destination.address}
                  </Text>
                </View>
              )}
            </>
          )}

          {item.type === 'ship' && (
            <View style={styles.routeInfo}>
              <Text style={styles.routeLabel}>航路</Text>
              <Text style={styles.routeText}>
                {item.departure?.port} → {item.arrival?.port}
              </Text>
            </View>
          )}

          {item.driver && (
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceLabel}>ドライバー</Text>
              <Text style={styles.serviceName}>
                {item.driver.name} (⭐ {item.driver.rating})
              </Text>
            </View>
          )}

          {item.vessel && (
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceLabel}>船舶</Text>
              <Text style={styles.serviceName}>
                {item.vessel.name} ({item.vessel.type})
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bookingFooter}>
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>
              {formatDate(item.created_at)}
            </Text>
          </View>
          <View style={styles.fareContainer}>
            <Text style={styles.fareAmount}>
              {formatAmount(item.fare)}
            </Text>
          </View>
        </View>

        {/* 評価表示 */}
        {item.status === 'completed' && item.rating && (
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingLabel}>あなたの評価:</Text>
            <Text style={styles.ratingValue}>
              {'⭐'.repeat(item.rating)} ({item.rating}/5)
            </Text>
          </View>
        )}

        {/* アクションボタン */}
        {item.status === 'completed' && !item.rating && (
          <View style={styles.actionContainer}>
            <TouchableOpacity 
              style={styles.rateButton}
              onPress={() => {
                // TODO: 評価画面を開く
                Alert.prompt(
                  '評価',
                  'この利用を評価してください (1-5):',
                  [
                    {text: 'キャンセル', style: 'cancel'},
                    {
                      text: '送信',
                      onPress: (text) => {
                        const rating = parseInt(text || '0');
                        if (rating >= 1 && rating <= 5) {
                          handleRateBooking(item.id, rating, '');
                        } else {
                          Alert.alert('エラー', '1から5の間で評価してください');
                        }
                      }
                    }
                  ],
                  'plain-text'
                );
              }}>
              <Text style={styles.rateButtonText}>評価する</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.status === 'pending' && (
          <View style={styles.actionContainer}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => {
                Alert.alert(
                  '予約キャンセル',
                  'この予約をキャンセルしますか？',
                  [
                    {text: 'いいえ', style: 'cancel'},
                    {
                      text: 'キャンセル',
                      style: 'destructive',
                      onPress: () => handleCancelBooking(item.id, 'ユーザーキャンセル')
                    }
                  ]
                );
              }}>
              <Text style={styles.cancelButtonText}>キャンセル</Text>
            </TouchableOpacity>
          </View>
        )}
      </GoCard>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <GoHeader
        title="予約履歴"
        showBack={true}
        onBack={() => navigation.goBack()}
      />

      {/* フィルタータブ */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, selectedFilter === 'all' && styles.filterTabActive]}
          onPress={() => setSelectedFilter('all')}>
          <Text style={[styles.filterTabText, selectedFilter === 'all' && styles.filterTabTextActive]}>
            すべて
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, selectedFilter === 'taxi' && styles.filterTabActive]}
          onPress={() => setSelectedFilter('taxi')}>
          <Text style={[styles.filterTabText, selectedFilter === 'taxi' && styles.filterTabTextActive]}>
            🚗 タクシー
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, selectedFilter === 'ship' && styles.filterTabActive]}
          onPress={() => setSelectedFilter('ship')}>
          <Text style={[styles.filterTabText, selectedFilter === 'ship' && styles.filterTabTextActive]}>
            🚢 船舶
          </Text>
        </TouchableOpacity>
      </View>

      {/* 予約履歴リスト */}
      <FlatList
        data={filteredBookings}
        renderItem={renderBookingItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>予約履歴がありません</Text>
            <Text style={styles.emptyDescription}>
              タクシーや船舶の予約をすると、ここに履歴が表示されます
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GoTheme.colors.background,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: GoTheme.spacing.md,
    paddingVertical: GoTheme.spacing.sm,
    backgroundColor: GoTheme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: GoTheme.colors.divider,
  },
  filterTab: {
    flex: 1,
    paddingVertical: GoTheme.spacing.sm,
    paddingHorizontal: GoTheme.spacing.md,
    marginHorizontal: GoTheme.spacing.xs,
    borderRadius: GoTheme.borderRadius.sm,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: GoTheme.colors.primary,
  },
  filterTabText: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.textSecondary,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: GoTheme.colors.textOnPrimary,
  },
  listContainer: {
    padding: GoTheme.spacing.md,
  },
  bookingCard: {
    marginBottom: GoTheme.spacing.md,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: GoTheme.spacing.md,
  },
  bookingType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    fontSize: 20,
    marginRight: GoTheme.spacing.sm,
  },
  typeName: {
    ...GoTheme.typography.h4,
    color: GoTheme.colors.text,
    fontWeight: 'bold',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: GoTheme.spacing.sm,
    paddingVertical: GoTheme.spacing.xs,
    borderRadius: GoTheme.borderRadius.sm,
  },
  statusText: {
    ...GoTheme.typography.bodySmall,
    fontWeight: '600',
  },
  bookingDetails: {
    marginBottom: GoTheme.spacing.md,
  },
  routeInfo: {
    marginBottom: GoTheme.spacing.sm,
  },
  routeLabel: {
    ...GoTheme.typography.bodySmall,
    color: GoTheme.colors.textSecondary,
    marginBottom: 2,
  },
  routeText: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.text,
    fontWeight: '500',
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: GoTheme.spacing.sm,
  },
  serviceLabel: {
    ...GoTheme.typography.bodySmall,
    color: GoTheme.colors.textSecondary,
    width: 80,
  },
  serviceName: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.text,
    fontWeight: '500',
    flex: 1,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: GoTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: GoTheme.colors.divider,
  },
  dateContainer: {
    flex: 1,
  },
  dateText: {
    ...GoTheme.typography.bodySmall,
    color: GoTheme.colors.textSecondary,
  },
  fareContainer: {
    alignItems: 'flex-end',
  },
  fareAmount: {
    ...GoTheme.typography.h4,
    color: GoTheme.colors.primary,
    fontWeight: 'bold',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: GoTheme.spacing.sm,
    paddingTop: GoTheme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: GoTheme.colors.divider,
  },
  ratingLabel: {
    ...GoTheme.typography.bodySmall,
    color: GoTheme.colors.textSecondary,
    marginRight: GoTheme.spacing.sm,
  },
  ratingValue: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.accent,
    fontWeight: '600',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: GoTheme.spacing.sm,
    paddingTop: GoTheme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: GoTheme.colors.divider,
  },
  rateButton: {
    paddingHorizontal: GoTheme.spacing.md,
    paddingVertical: GoTheme.spacing.sm,
    backgroundColor: GoTheme.colors.primary,
    borderRadius: GoTheme.borderRadius.sm,
  },
  rateButtonText: {
    ...GoTheme.typography.bodySmall,
    color: GoTheme.colors.textOnPrimary,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: GoTheme.spacing.md,
    paddingVertical: GoTheme.spacing.sm,
    backgroundColor: GoTheme.colors.error,
    borderRadius: GoTheme.borderRadius.sm,
  },
  cancelButtonText: {
    ...GoTheme.typography.bodySmall,
    color: GoTheme.colors.textOnPrimary,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: GoTheme.spacing.xl * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: GoTheme.spacing.lg,
  },
  emptyTitle: {
    ...GoTheme.typography.h3,
    color: GoTheme.colors.text,
    textAlign: 'center',
    marginBottom: GoTheme.spacing.sm,
  },
  emptyDescription: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: GoTheme.spacing.lg,
  },
});