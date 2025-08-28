import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { GoCard } from '../GoStyle/GoCard';
import { GoButton } from '../GoStyle/GoButton';
import { useTheme } from '../../contexts/ThemeContext';
import { logger } from '../../config/environment';

interface BookingHistoryTabProps {
  currentMode: 'taxi' | 'ship';
}

interface HistoryItem {
  id: string;
  type: 'taxi' | 'ship';
  date: string;
  time: string;
  from: string;
  to: string;
  status: 'completed' | 'cancelled';
  price: number;
  duration?: number;
  distance?: number;
  driverName?: string;
  rating?: number;
}

export const BookingHistoryTab: React.FC<BookingHistoryTabProps> = ({ currentMode }) => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    loadBookingHistory();
  }, [currentMode]);

  const loadBookingHistory = async () => {
    setIsLoading(true);
    try {
      logger.log('Loading booking history for mode:', currentMode);
      
      // モックデータ
      const mockHistory: HistoryItem[] = currentMode === 'taxi' ? [
        {
          id: 'hist_tx_001',
          type: 'taxi',
          date: '2024-08-10',
          time: '14:30',
          from: '大阪駅',
          to: '関西国際空港',
          status: 'completed',
          price: 15000,
          duration: 45,
          distance: 50.2,
          driverName: '田中 太郎',
          rating: 5,
        },
        {
          id: 'hist_tx_002',
          type: 'taxi',
          date: '2024-08-08',
          time: '09:15',
          from: '心斎橋',
          to: '大阪城',
          status: 'completed',
          price: 2800,
          duration: 25,
          distance: 8.5,
          driverName: '佐藤 花子',
          rating: 4,
        },
        {
          id: 'hist_tx_003',
          type: 'taxi',
          date: '2024-08-05',
          time: '18:00',
          from: '梅田',
          to: '新大阪駅',
          status: 'cancelled',
          price: 1500,
        },
        {
          id: 'hist_tx_004',
          type: 'taxi',
          date: '2024-08-03',
          time: '12:20',
          from: '天神橋筋六丁目',
          to: 'USJ',
          status: 'completed',
          price: 4200,
          duration: 35,
          distance: 15.8,
          driverName: '鈴木 一郎',
          rating: 5,
        }
      ] : [
        {
          id: 'hist_sp_001',
          type: 'ship',
          date: '2024-08-12',
          time: '11:00',
          from: '大阪港',
          to: '神戸港',
          status: 'completed',
          price: 1200,
          duration: 60,
          distance: 35.0,
          driverName: '海運 太郎',
          rating: 5,
        },
        {
          id: 'hist_sp_002',
          type: 'ship',
          date: '2024-08-09',
          time: '16:30',
          from: '関空連絡橋',
          to: '淡路島',
          status: 'completed',
          price: 3500,
          duration: 90,
          distance: 45.5,
          driverName: '船舶 花子',
          rating: 4,
        },
        {
          id: 'hist_sp_003',
          type: 'ship',
          date: '2024-08-06',
          time: '08:45',
          from: '堺港',
          to: '和歌山港',
          status: 'cancelled',
          price: 2800,
        }
      ];
      
      await new Promise(resolve => setTimeout(resolve, 500));
      setHistoryItems(mockHistory);
      
    } catch (error) {
      logger.error('Failed to load booking history:', error);
      Alert.alert('エラー', '履歴情報の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRate = (historyId: string, item: HistoryItem) => {
    if (item.status !== 'completed') return;
    
    navigation.navigate('Rating', {
      bookingId: historyId,
      serviceType: item.type,
      driverName: item.driverName,
      vehicleInfo: item.type === 'taxi' ? '車両情報' : '船舶情報',
      tripData: {
        pickup: item.from,
        destination: item.to,
        duration: item.duration || 0,
        distance: item.distance || 0,
        fare: item.price,
      },
    });
  };

  const handleRebook = (item: HistoryItem) => {
    if (item.type === 'taxi') {
      navigation.navigate('TaxiSelection', {
        pickup: {
          latitude: 34.6851, // モック座標
          longitude: 135.5136,
          address: item.from,
        },
        destination: {
          latitude: 34.6937,
          longitude: 135.5023,
          address: item.to,
        },
      });
    } else {
      navigation.navigate('ShipBooking');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '完了';
      case 'cancelled': return 'キャンセル';
      default: return status;
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Text key={i} style={styles.star}>
        {i < rating ? '⭐' : '☆'}
      </Text>
    ));
  };

  const filteredItems = historyItems.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>履歴を読み込み中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ヘッダー・フィルター */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {currentMode === 'taxi' ? 'タクシー' : '船舶'}利用履歴
        </Text>
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'all' && styles.activeFilterButton
            ]}
            onPress={() => setFilter('all')}
          >
            <Text style={[
              styles.filterText,
              filter === 'all' && styles.activeFilterText
            ]}>
              全て
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'completed' && styles.activeFilterButton
            ]}
            onPress={() => setFilter('completed')}
          >
            <Text style={[
              styles.filterText,
              filter === 'completed' && styles.activeFilterText
            ]}>
              完了
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'cancelled' && styles.activeFilterButton
            ]}
            onPress={() => setFilter('cancelled')}
          >
            <Text style={[
              styles.filterText,
              filter === 'cancelled' && styles.activeFilterText
            ]}>
              キャンセル
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 履歴リスト */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {filteredItems.length === 0 ? (
          <GoCard style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>
              {currentMode === 'taxi' ? '🚗' : '🚢'}
            </Text>
            <Text style={styles.emptyTitle}>利用履歴がありません</Text>
            <Text style={styles.emptySubtitle}>
              {currentMode === 'taxi' ? 'タクシー' : '船舶'}を利用すると履歴が表示されます
            </Text>
          </GoCard>
        ) : (
          filteredItems.map((item) => (
            <GoCard key={item.id} style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <View style={styles.dateInfo}>
                  <Text style={styles.historyDate}>
                    {item.date} {item.time}
                  </Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(item.status) }
                  ]}>
                    <Text style={styles.statusText}>
                      {getStatusText(item.status)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.historyPrice}>
                  ¥{item.price.toLocaleString()}
                </Text>
              </View>

              <View style={styles.routeContainer}>
                <View style={styles.routePoint}>
                  <Text style={styles.routeIcon}>📍</Text>
                  <Text style={styles.routeText}>{item.from}</Text>
                </View>
                <View style={styles.routeLine} />
                <View style={styles.routePoint}>
                  <Text style={styles.routeIcon}>🎯</Text>
                  <Text style={styles.routeText}>{item.to}</Text>
                </View>
              </View>

              {/* 完了した予約の詳細情報 */}
              {item.status === 'completed' && (
                <View style={styles.tripDetails}>
                  {item.driverName && (
                    <Text style={styles.driverName}>
                      {currentMode === 'taxi' ? 'ドライバー' : '船員'}: {item.driverName}
                    </Text>
                  )}
                  <View style={styles.tripStats}>
                    {item.duration && (
                      <Text style={styles.tripStat}>⏱️ {item.duration}分</Text>
                    )}
                    {item.distance && (
                      <Text style={styles.tripStat}>📏 {item.distance}km</Text>
                    )}
                  </View>
                  {item.rating && (
                    <View style={styles.ratingContainer}>
                      <Text style={styles.ratingLabel}>評価:</Text>
                      <View style={styles.starsContainer}>
                        {renderStars(item.rating)}
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* アクション */}
              <View style={styles.actionContainer}>
                <TouchableOpacity
                  style={styles.rebookButton}
                  onPress={() => handleRebook(item)}
                >
                  <Text style={styles.rebookButtonText}>再予約</Text>
                </TouchableOpacity>
                {item.status === 'completed' && !item.rating && (
                  <TouchableOpacity
                    style={[styles.rateButton, { backgroundColor: colors.primary }]}
                    onPress={() => handleRate(item.id, item)}
                  >
                    <Text style={styles.rateButtonText}>評価</Text>
                  </TouchableOpacity>
                )}
              </View>
            </GoCard>
          ))
        )}
      </ScrollView>
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
  header: {
    backgroundColor: '#ffffff',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  activeFilterButton: {
    backgroundColor: '#1e40af',
    borderColor: '#1e40af',
  },
  filterText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  activeFilterText: {
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },

  // 空の状態
  emptyCard: {
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
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

  // 履歴カード
  historyCard: {
    padding: 16,
    marginBottom: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  dateInfo: {
    flex: 1,
  },
  historyDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  historyPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
  },

  // ルート表示
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

  // 詳細情報
  tripDetails: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginBottom: 16,
  },
  driverName: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  tripStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  tripStat: {
    fontSize: 12,
    color: '#6b7280',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: 14,
    color: '#374151',
    marginRight: 8,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  star: {
    fontSize: 14,
  },

  // アクション
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  rebookButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e40af',
  },
  rebookButtonText: {
    color: '#1e40af',
    fontSize: 14,
    fontWeight: '600',
  },
  rateButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  rateButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default BookingHistoryTab;