import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {GoButton, GoCard, GoHeader} from '../components/GoStyle';
import {GoTheme} from '../theme/GoTheme';
import {qrService, QuickBookingData} from '../services/api/qrService';

export interface QRHistoryScreenProps {
  navigation: any;
}

export const QRHistoryScreen: React.FC<QRHistoryScreenProps> = ({navigation}) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [qrBookings, setQrBookings] = useState<QuickBookingData[]>([]);
  const [stats, setStats] = useState({
    total_scans: 0,
    successful_bookings: 0,
    most_popular_stations: [],
    recent_activity: [],
  });

  const loadQRHistory = useCallback(async () => {
    setLoading(true);
    try {
      const [historyResponse, statsResponse] = await Promise.all([
        qrService.getQRBookingHistory(20, 0),
        qrService.getQRStats(),
      ]);

      if (historyResponse.success && historyResponse.data) {
        setQrBookings(historyResponse.data);
      }

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }
    } catch (error) {
      console.error('QR履歴取得エラー:', error);
      Alert.alert('エラー', 'QR履歴の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadQRHistory();
    setRefreshing(false);
  }, [loadQRHistory]);

  useEffect(() => {
    loadQRHistory();
  }, [loadQRHistory]);

  const getServiceTypeIcon = (serviceType: 'taxi' | 'ship') => {
    return serviceType === 'taxi' ? '🚗' : '🚢';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return GoTheme.colors.success;
      case 'pending':
        return GoTheme.colors.warning;
      case 'completed':
        return GoTheme.colors.primary;
      case 'cancelled':
        return GoTheme.colors.error;
      default:
        return GoTheme.colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return '確定';
      case 'pending': return '処理中';
      case 'completed': return '完了';
      case 'cancelled': return 'キャンセル';
      default: return status;
    }
  };

  const handleBookingPress = (booking: QuickBookingData) => {
    const trackingScreen = booking.service_type === 'taxi' ? 'TaxiTracking' : 'ShipTracking';
    
    if (booking.status === 'confirmed' || booking.status === 'pending') {
      // アクティブな予約の場合は追跡画面へ
      navigation.navigate(trackingScreen, {
        bookingId: booking.booking_id,
        bookingData: booking,
      });
    } else {
      // 完了/キャンセルした予約の詳細表示
      Alert.alert(
        '予約詳細',
        `予約ID: ${booking.booking_id}\nサービス: ${booking.service_type === 'taxi' ? 'タクシー' : '船舶'}\nステータス: ${getStatusText(booking.status)}\n料金: ¥${booking.estimated_fare.toLocaleString()}${booking.special_offer ? `\n割引: ${booking.special_offer.discount}% (${booking.special_offer.reason})` : ''}`,
        [
          { text: 'OK', onPress: () => {} },
          ...(booking.status === 'completed' ? [
            { 
              text: '評価する', 
              onPress: () => {
                navigation.navigate('Rating', {
                  bookingId: booking.booking_id,
                  serviceType: booking.service_type,
                });
              }
            }
          ] : []),
        ]
      );
    }
  };

  const renderBookingCard = (booking: QuickBookingData, index: number) => (
    <TouchableOpacity
      key={booking.booking_id}
      onPress={() => handleBookingPress(booking)}>
      <GoCard style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceIcon}>
              {getServiceTypeIcon(booking.service_type)}
            </Text>
            <View style={styles.bookingDetails}>
              <Text style={styles.bookingId}>
                #{booking.booking_id.substring(0, 8)}
              </Text>
              <Text style={styles.serviceType}>
                QR {booking.service_type === 'taxi' ? 'タクシー' : '船舶'}予約
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(booking.status) + '20' },
            ]}>
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(booking.status) },
              ]}>
              {getStatusText(booking.status)}
            </Text>
          </View>
        </View>

        <View style={styles.routeInfo}>
          <Text style={styles.routeText}>
            📍 {booking.pickup.address || booking.pickup.name}
          </Text>
          {booking.destination && (
            <Text style={styles.routeText}>
              🏁 {booking.destination.address || booking.destination.name}
            </Text>
          )}
        </View>

        <View style={styles.bookingFooter}>
          <View style={styles.fareInfo}>
            <Text style={styles.fareAmount}>
              ¥{booking.estimated_fare.toLocaleString()}
            </Text>
            {booking.special_offer && (
              <Text style={styles.discountText}>
                {booking.special_offer.discount}% OFF
              </Text>
            )}
          </View>
          {booking.estimated_duration && (
            <Text style={styles.durationText}>
              約{booking.estimated_duration}分
            </Text>
          )}
        </View>

        {booking.driver_info && (
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>
              👨‍✈️ {booking.driver_info.name}
            </Text>
            <Text style={styles.vehicleInfo}>
              {booking.driver_info.vehicle_model}
            </Text>
          </View>
        )}

        {booking.vessel_info && (
          <View style={styles.vesselInfo}>
            <Text style={styles.vesselName}>
              🚢 {booking.vessel_info.name}
            </Text>
            <Text style={styles.vesselType}>
              {booking.vessel_info.type === 'ferry' ? 'フェリー' : 'ジェットフォイル'}
            </Text>
          </View>
        )}
      </GoCard>
    </TouchableOpacity>
  );

  if (loading && qrBookings.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <GoHeader
          title="QR予約履歴"
          showBack={true}
          onBack={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={GoTheme.colors.primary} />
          <Text style={styles.loadingText}>履歴を読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <GoHeader
        title="QR予約履歴"
        showBack={true}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[GoTheme.colors.primary]}
            tintColor={GoTheme.colors.primary}
          />
        }>
        
        {/* 統計情報 */}
        <GoCard style={styles.statsCard}>
          <Text style={styles.statsTitle}>QR利用統計</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.total_scans}</Text>
              <Text style={styles.statLabel}>スキャン回数</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.successful_bookings}</Text>
              <Text style={styles.statLabel}>予約成功</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {stats.total_scans > 0 
                  ? Math.round((stats.successful_bookings / stats.total_scans) * 100) 
                  : 0}%
              </Text>
              <Text style={styles.statLabel}>成功率</Text>
            </View>
          </View>
        </GoCard>

        {/* 人気の場所 */}
        {stats.most_popular_stations.length > 0 && (
          <GoCard style={styles.popularCard}>
            <Text style={styles.sectionTitle}>よく利用する場所</Text>
            {stats.most_popular_stations.slice(0, 3).map((station: any, index: number) => (
              <View key={index} style={styles.popularItem}>
                <Text style={styles.popularName}>{station.name}</Text>
                <Text style={styles.popularCount}>{station.scan_count}回</Text>
              </View>
            ))}
          </GoCard>
        )}

        {/* 予約履歴リスト */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>QR予約履歴</Text>
          
          {qrBookings.length === 0 ? (
            <GoCard style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📱</Text>
              <Text style={styles.emptyTitle}>QR予約履歴がありません</Text>
              <Text style={styles.emptyText}>
                QRコードをスキャンして予約すると、こちらに履歴が表示されます。
              </Text>
              <GoButton
                variant="primary"
                size="medium"
                onPress={() => navigation.navigate('QRScanner')}
                style={styles.scanButton}>
                QRコードをスキャン
              </GoButton>
            </GoCard>
          ) : (
            qrBookings.map((booking, index) => renderBookingCard(booking, index))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GoTheme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.textSecondary,
    marginTop: GoTheme.spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  statsCard: {
    marginHorizontal: GoTheme.spacing.md,
    marginTop: GoTheme.spacing.md,
  },
  statsTitle: {
    ...GoTheme.typography.h4,
    color: GoTheme.colors.text,
    fontWeight: 'bold',
    marginBottom: GoTheme.spacing.md,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    ...GoTheme.typography.h2,
    color: GoTheme.colors.primary,
    fontWeight: 'bold',
  },
  statLabel: {
    ...GoTheme.typography.bodySmall,
    color: GoTheme.colors.textSecondary,
    marginTop: 4,
  },
  popularCard: {
    marginHorizontal: GoTheme.spacing.md,
    marginTop: GoTheme.spacing.md,
  },
  sectionTitle: {
    ...GoTheme.typography.h4,
    color: GoTheme.colors.text,
    fontWeight: 'bold',
    marginBottom: GoTheme.spacing.md,
    marginHorizontal: GoTheme.spacing.md,
  },
  popularItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: GoTheme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: GoTheme.colors.divider,
  },
  popularName: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.text,
  },
  popularCount: {
    ...GoTheme.typography.bodySmall,
    color: GoTheme.colors.primary,
    fontWeight: '600',
  },
  historySection: {
    marginTop: GoTheme.spacing.md,
    paddingBottom: GoTheme.spacing.xl,
  },
  bookingCard: {
    marginHorizontal: GoTheme.spacing.md,
    marginBottom: GoTheme.spacing.md,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: GoTheme.spacing.md,
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceIcon: {
    fontSize: 24,
    marginRight: GoTheme.spacing.md,
  },
  bookingDetails: {
    flex: 1,
  },
  bookingId: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.text,
    fontWeight: '600',
  },
  serviceType: {
    ...GoTheme.typography.bodySmall,
    color: GoTheme.colors.textSecondary,
    marginTop: 2,
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
  routeInfo: {
    marginBottom: GoTheme.spacing.md,
  },
  routeText: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.textSecondary,
    marginBottom: 4,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: GoTheme.spacing.sm,
  },
  fareInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fareAmount: {
    ...GoTheme.typography.h4,
    color: GoTheme.colors.text,
    fontWeight: 'bold',
  },
  discountText: {
    ...GoTheme.typography.bodySmall,
    color: GoTheme.colors.success,
    fontWeight: '600',
    marginLeft: GoTheme.spacing.sm,
    backgroundColor: GoTheme.colors.success + '20',
    paddingHorizontal: GoTheme.spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
  },
  durationText: {
    ...GoTheme.typography.bodySmall,
    color: GoTheme.colors.textSecondary,
  },
  driverInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: GoTheme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: GoTheme.colors.divider,
  },
  driverName: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.text,
    fontWeight: '600',
  },
  vehicleInfo: {
    ...GoTheme.typography.bodySmall,
    color: GoTheme.colors.textSecondary,
  },
  vesselInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: GoTheme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: GoTheme.colors.divider,
  },
  vesselName: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.text,
    fontWeight: '600',
  },
  vesselType: {
    ...GoTheme.typography.bodySmall,
    color: GoTheme.colors.textSecondary,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: GoTheme.spacing.xl,
    marginHorizontal: GoTheme.spacing.md,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: GoTheme.spacing.md,
  },
  emptyTitle: {
    ...GoTheme.typography.h4,
    color: GoTheme.colors.text,
    fontWeight: 'bold',
    marginBottom: GoTheme.spacing.sm,
  },
  emptyText: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: GoTheme.spacing.lg,
  },
  scanButton: {
    marginTop: GoTheme.spacing.md,
  },
});