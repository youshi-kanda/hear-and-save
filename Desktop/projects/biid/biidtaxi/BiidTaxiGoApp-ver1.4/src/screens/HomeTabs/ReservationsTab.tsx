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
  const [reservations, setReservations] = useState<ReservationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReservations();
  }, [currentMode]);

  const loadReservations = async () => {
    setIsLoading(true);
    try {
      logger.log('Loading reservations for mode:', currentMode);
      
      // モックデータ
      const mockReservations: ReservationData[] = currentMode === 'taxi' ? [
        {
          id: 'tx001',
          type: 'taxi',
          date: '2024-08-15',
          time: '09:30',
          from: '東京駅丸の内南口',
          to: '羽田空港第2ターミナル',
          status: 'confirmed',
          price: 6500,
        },
        {
          id: 'tx002',
          type: 'taxi',
          date: '2024-08-16',
          time: '14:00',
          from: '新宿駅南口',
          to: '東京スカイツリー',
          status: 'pending',
          price: 3200,
        }
      ] : [
        {
          id: 'sp001',
          type: 'ship',
          date: '2024-08-15',
          time: '10:15',
          from: '浜松町桟橋',
          to: '大島港',
          status: 'confirmed',
          price: 4500,
        },
        {
          id: 'sp002',
          type: 'ship',
          date: '2024-08-17',
          time: '16:30',
          from: '竹芝客船ターミナル',
          to: '神津島港',
          status: 'confirmed',
          price: 6800,
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
      Alert.alert('タクシー予約', 'タクシー事前予約機能を実装中です');
    } else {
      Alert.alert('船舶予約', '船舶予約機能を実装中です');
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
              style={[styles.emptyButton, { backgroundColor: '#3b82f6' }]}
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
                  <TouchableOpacity style={[styles.detailButton, { backgroundColor: '#3b82f6' }]}>
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
    color: '#1f2937',
  },
  newReservationButton: {
    backgroundColor: '#3b82f6',
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
    color: '#1f2937',
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
    color: '#1f2937',
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
    color: '#1f2937',
  },
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
    color: '#1f2937',
    flex: 1,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#d1d5db',
    marginLeft: 9,
    marginVertical: 4,
  },
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