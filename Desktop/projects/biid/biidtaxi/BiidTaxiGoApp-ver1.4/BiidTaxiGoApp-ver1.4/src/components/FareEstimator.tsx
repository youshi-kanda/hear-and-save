import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {GoCard} from './GoStyle';
import {GoTheme} from '../theme/GoTheme';
import {fareService} from '../services/api/fareService';
import {Location} from '../services/api/types';

export interface FareEstimatorProps {
  pickup?: Location;
  destination?: Location;
  serviceType: 'taxi' | 'ship';
  vehicleType?: string;
  passengers?: number;
  onFareUpdate?: (fare: number, duration: number, distance: number) => void;
}

interface FareEstimate {
  fare: number;
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  surge?: number;
  taxes: number;
  total: number;
  distance: number;
  duration: number;
  breakdown: {
    item: string;
    amount: number;
    description?: string;
  }[];
}

export const FareEstimator: React.FC<FareEstimatorProps> = ({
  pickup,
  destination,
  serviceType,
  vehicleType = 'standard',
  passengers = 1,
  onFareUpdate,
}) => {
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState<FareEstimate | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (pickup && destination) {
      calculateFare();
    } else {
      setEstimate(null);
      setError(null);
    }
  }, [pickup, destination, vehicleType, passengers]);

  const calculateFare = async () => {
    if (!pickup || !destination) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fareService.calculateFare({
        pickup,
        destination,
        service_type: serviceType,
        vehicle_type: vehicleType,
        passengers,
      });

      if (response.success && response.data) {
        const fareData = response.data;
        
        // 料金内訳を整理
        const fareEstimate: FareEstimate = {
          fare: fareData.total,
          baseFare: fareData.base_fare,
          distanceFare: fareData.distance_fare,
          timeFare: fareData.time_fare,
          surge: fareData.surge_multiplier || 1,
          taxes: fareData.taxes,
          total: fareData.total,
          distance: fareData.distance,
          duration: fareData.duration,
          breakdown: fareData.breakdown
        };

        setEstimate(fareEstimate);
        
        // 親コンポーネントに料金情報を通知
        if (onFareUpdate) {
          onFareUpdate(
            fareEstimate.total,
            fareEstimate.duration,
            fareEstimate.distance
          );
        }
      } else {
        setError(response.error || '料金の取得に失敗しました');
      }
    } catch (error) {
      console.error('Fare estimation error:', error);
      setError('料金の計算中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  };

  const formatDistance = (distance: number) => {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    }
    return `${(distance / 1000).toFixed(1)}km`;
  };

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60);
    if (minutes < 60) {
      return `${minutes}分`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}時間${remainingMinutes}分`;
  };

  const handleRetry = () => {
    calculateFare();
  };

  const showBreakdown = () => {
    if (!estimate) return;

    const breakdownText = estimate.breakdown
      .map(item => `• ${item.item}: ${formatAmount(item.amount)}`)
      .join('\n');

    Alert.alert(
      '料金内訳',
      breakdownText + `\n\n合計: ${formatAmount(estimate.total)}`,
      [{text: 'OK'}]
    );
  };

  if (!pickup || !destination) {
    return (
      <GoCard style={styles.container}>
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderIcon}>💰</Text>
          <Text style={styles.placeholderText}>
            {serviceType === 'taxi' ? 'お迎え場所と目的地を設定すると料金を表示します' : '出発港と到着港を設定すると料金を表示します'}
          </Text>
        </View>
      </GoCard>
    );
  }

  if (loading) {
    return (
      <GoCard style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={GoTheme.colors.primary} />
          <Text style={styles.loadingText}>料金を計算中...</Text>
        </View>
      </GoCard>
    );
  }

  if (error) {
    return (
      <GoCard style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>再試行</Text>
          </TouchableOpacity>
        </View>
      </GoCard>
    );
  }

  if (!estimate) {
    return null;
  }

  return (
    <GoCard style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>料金見積もり</Text>
        <TouchableOpacity onPress={showBreakdown}>
          <Text style={styles.detailsButton}>詳細 ›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mainFare}>
        <Text style={styles.fareAmount}>{formatAmount(estimate.total)}</Text>
        {estimate.surge && estimate.surge > 1 && (
          <View style={styles.surgeContainer}>
            <Text style={styles.surgeText}>混雑料金 {estimate.surge}倍</Text>
          </View>
        )}
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>距離</Text>
          <Text style={styles.detailValue}>{formatDistance(estimate.distance)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>
            {serviceType === 'taxi' ? '予想所要時間' : '乗船時間'}
          </Text>
          <Text style={styles.detailValue}>{formatDuration(estimate.duration)}</Text>
        </View>
        {serviceType === 'taxi' && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>車種</Text>
            <Text style={styles.detailValue}>
              {vehicleType === 'standard' ? 'スタンダード' : 
               vehicleType === 'premium' ? 'プレミアム' : 
               vehicleType === 'van' ? 'バン' : vehicleType}
            </Text>
          </View>
        )}
        {serviceType === 'ship' && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>乗船者数</Text>
            <Text style={styles.detailValue}>{passengers}名</Text>
          </View>
        )}
      </View>

      <View style={styles.breakdown}>
        <Text style={styles.breakdownTitle}>料金内訳</Text>
        {estimate.breakdown.slice(0, 3).map((item, index) => (
          <View key={index} style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>{item.item}</Text>
            <Text style={styles.breakdownValue}>{formatAmount(item.amount)}</Text>
          </View>
        ))}
        {estimate.breakdown.length > 3 && (
          <TouchableOpacity style={styles.showAllButton} onPress={showBreakdown}>
            <Text style={styles.showAllText}>すべて表示</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.notice}>
        <Text style={styles.noticeText}>
          ⚠️ 実際の料金は交通状況により変動する場合があります
        </Text>
      </View>

      <TouchableOpacity style={styles.refreshButton} onPress={calculateFare}>
        <Text style={styles.refreshButtonText}>🔄 料金を更新</Text>
      </TouchableOpacity>
    </GoCard>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: GoTheme.spacing.md,
  },
  placeholderContainer: {
    alignItems: 'center',
    paddingVertical: GoTheme.spacing.xl,
  },
  placeholderIcon: {
    fontSize: 32,
    marginBottom: GoTheme.spacing.sm,
  },
  placeholderText: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.textSecondary,
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: GoTheme.spacing.lg,
  },
  loadingText: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.textSecondary,
    marginLeft: GoTheme.spacing.sm,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: GoTheme.spacing.lg,
  },
  errorIcon: {
    fontSize: 24,
    marginBottom: GoTheme.spacing.sm,
  },
  errorText: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.error,
    textAlign: 'center',
    marginBottom: GoTheme.spacing.md,
  },
  retryButton: {
    paddingHorizontal: GoTheme.spacing.lg,
    paddingVertical: GoTheme.spacing.md,
    backgroundColor: GoTheme.colors.primary,
    borderRadius: GoTheme.borderRadius.lg,
    ...GoTheme.shadows.small,
  },
  retryButtonText: {
    ...GoTheme.typography.bodySmall,
    color: GoTheme.colors.textOnPrimary,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: GoTheme.spacing.md,
  },
  title: {
    ...GoTheme.typography.h4,
    color: GoTheme.colors.text,
    fontWeight: 'bold',
  },
  detailsButton: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.primary,
    fontWeight: '600',
  },
  mainFare: {
    alignItems: 'center',
    marginBottom: GoTheme.spacing.lg,
  },
  fareAmount: {
    ...GoTheme.typography.h1,
    color: GoTheme.colors.primary,
    fontWeight: 'bold',
  },
  surgeContainer: {
    marginTop: GoTheme.spacing.xs,
    paddingHorizontal: GoTheme.spacing.sm,
    paddingVertical: GoTheme.spacing.xs,
    backgroundColor: GoTheme.colors.warning + '20',
    borderRadius: GoTheme.borderRadius.sm,
  },
  surgeText: {
    ...GoTheme.typography.bodySmall,
    color: GoTheme.colors.warning,
    fontWeight: '600',
  },
  details: {
    marginBottom: GoTheme.spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: GoTheme.spacing.sm,
  },
  detailLabel: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.textSecondary,
  },
  detailValue: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.text,
    fontWeight: '500',
  },
  breakdown: {
    paddingTop: GoTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: GoTheme.colors.divider,
    marginBottom: GoTheme.spacing.md,
  },
  breakdownTitle: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.text,
    fontWeight: 'bold',
    marginBottom: GoTheme.spacing.sm,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: GoTheme.spacing.xs,
  },
  breakdownLabel: {
    ...GoTheme.typography.bodySmall,
    color: GoTheme.colors.textSecondary,
  },
  breakdownValue: {
    ...GoTheme.typography.bodySmall,
    color: GoTheme.colors.text,
    fontWeight: '500',
  },
  showAllButton: {
    alignItems: 'center',
    marginTop: GoTheme.spacing.sm,
  },
  showAllText: {
    ...GoTheme.typography.bodySmall,
    color: GoTheme.colors.primary,
    fontWeight: '600',
  },
  notice: {
    paddingVertical: GoTheme.spacing.sm,
    paddingHorizontal: GoTheme.spacing.md,
    backgroundColor: GoTheme.colors.warning + '10',
    borderRadius: GoTheme.borderRadius.sm,
    marginBottom: GoTheme.spacing.md,
  },
  noticeText: {
    ...GoTheme.typography.bodySmall,
    color: GoTheme.colors.textSecondary,
    textAlign: 'center',
  },
  refreshButton: {
    alignItems: 'center',
    paddingVertical: GoTheme.spacing.sm,
  },
  refreshButtonText: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.primary,
    fontWeight: '600',
  },
});