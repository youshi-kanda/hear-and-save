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

interface ReservationsTabProps {
  currentMode: 'taxi' | 'ship';
}

interface ReservationData {
  id: string;
  type: 'taxi' | 'ship';
  date: string;
  time: string;
  from: string;
  to: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  price?: number;
}

export const ReservationsTab: React.FC<ReservationsTabProps> = ({ currentMode }) => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  
  const [reservations, setReservations] = useState<ReservationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReservations();
  }, [currentMode]);

  const loadReservations = async () => {
    setIsLoading(true);
    try {
      // TODO: 実際のAPI呼び出し
      logger.log('Loading reservations for mode:', currentMode);
      
      // モックデータ
      const mockReservations: ReservationData[] = currentMode === 'taxi' ? [
        {
          id: 'tx001',
          type: 'taxi',
          date: '2024-08-15',
          time: '09:30',
          from: '大阪駅',
          to: '関西国際空港',
          status: 'confirmed',
          price: 15000,
        },
        {
          id: 'tx002', 
          type: 'taxi',
          date: '2024-08-16',
          time: '14:00',
          from: '心斎橋',
          to: '大阪城',
          status: 'pending',
          price: 2800,
        }
      ] : [
        {
          id: 'sp001',
          type: 'ship',
          date: '2024-08-15',
          time: '10:15',
          from: '大阪港',
          to: '神戸港',
          status: 'confirmed',
          price: 1200,
        },
        {
          id: 'sp002',
          type: 'ship', 
          date: '2024-08-17',
          time: '16:30',
          from: '関空連絡橋',
          to: '淡路島',
          status: 'confirmed',
          price: 3500,
        }
      ];
      
      await new Promise(resolve => setTimeout(resolve, 500));
      setReservations(mockReservations);
      
    } catch (error) {
      logger.error('Failed to load reservations:', error);
      Alert.alert('エラー', '予約情報の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewReservation = () => {
    if (currentMode === 'taxi') {
      // タクシー事前予約画面へ
      Alert.alert('タクシー予約', 'タクシー事前予約機能を実装中です');
    } else {
      // 船舶予約画面へ
      navigation.navigate('ShipBooking');
    }
  };

  const handleCancelReservation = (reservationId: string) => {
    Alert.alert(
      '予約のキャンセル',
      'この予約をキャンセルしますか？',
      [
        { text: 'いいえ', style: 'cancel' },
        { 
          text: 'キャンセル', 
          style: 'destructive',
          onPress: () => {
            // TODO: キャンセルAPI呼び出し
            setReservations(prev => 
              prev.map(res => 
                res.id === reservationId 
                  ? { ...res, status: 'cancelled' as const }
                  : res
              )
            );
          }
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return '確定';
      case 'pending': return '保留中';
      case 'cancelled': return 'キャンセル';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>予約情報を読み込み中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {currentMode === 'taxi' ? 'タクシー予約' : '船舶予約'}
        </Text>
        <TouchableOpacity 
          style={styles.newReservationButton}
          onPress={handleNewReservation}
        >
          <Text style={styles.newReservationText}>+ 新規予約</Text>
        </TouchableOpacity>
      </View>

      {/* 予約リスト */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {reservations.length === 0 ? (
          <GoCard style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>
              {currentMode === 'taxi' ? '🚗' : '🚢'}
            </Text>
            <Text style={styles.emptyTitle}>予約がありません</Text>
            <Text style={styles.emptySubtitle}>
              {currentMode === 'taxi' ? 'タクシーの事前予約' : '船舶の予約'}をしてみましょう
            </Text>
            <GoButton
              title="新規予約"
              onPress={handleNewReservation}
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
              textStyle={styles.emptyButtonText}
            />
          </GoCard>
        ) : (
          reservations.map((reservation) => (
            <GoCard key={reservation.id} style={styles.reservationCard}>
              <View style={styles.reservationHeader}>
                <View style={styles.reservationInfo}>
                  <Text style={styles.reservationDate}>
                    {reservation.date} {reservation.time}
                  </Text>
                  <View style={[
                    styles.statusBadge, 
                    { backgroundColor: getStatusColor(reservation.status) }
                  ]}>
                    <Text style={styles.statusText}>
                      {getStatusText(reservation.status)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.reservationPrice}>
                  ¥{reservation.price?.toLocaleString()}
                </Text>
              </View>

              <View style={styles.routeContainer}>
                <View style={styles.routePoint}>
                  <Text style={styles.routeIcon}>📍</Text>
                  <Text style={styles.routeText}>{reservation.from}</Text>
                </View>
                <View style={styles.routeLine} />
                <View style={styles.routePoint}>
                  <Text style={styles.routeIcon}>🎯</Text>
                  <Text style={styles.routeText}>{reservation.to}</Text>
                </View>
              </View>

              {reservation.status !== 'cancelled' && (
                <View style={styles.actionContainer}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => handleCancelReservation(reservation.id)}
                  >
                    <Text style={styles.cancelButtonText}>キャンセル</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.detailButton, { backgroundColor: colors.primary }]}>
                    <Text style={styles.detailButtonText}>詳細</Text>
                  </TouchableOpacity>
                </View>
              )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
  },
  newReservationButton: {
    backgroundColor: '#1e40af',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  newReservationText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
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
    marginBottom: 24,
  },
  emptyButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 20,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },

  // 予約カード
  reservationCard: {
    padding: 16,
    marginBottom: 12,
  },
  reservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  reservationInfo: {
    flex: 1,
  },
  reservationDate: {
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
  reservationPrice: {
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

  // アクション
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ef4444',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  detailButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  detailButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ReservationsTab;