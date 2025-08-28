import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ViewStyle,
} from 'react-native';
import {GoTheme} from '../theme/GoTheme';
import {useTheme} from '../contexts/ThemeContext';

export interface ShipNowPaneProps {
  // 港情報
  departurePort?: string;
  arrivalPort?: string;
  
  // 料金・時間
  estimatedFare?: number;
  estimatedTime?: string;
  
  // 乗客数
  passengers?: number;
  onPassengersChange?: (count: number) => void;
  
  // コールバック
  onConfirmBooking?: () => void;
  onEditDeparture?: () => void;
  onEditArrival?: () => void;
  
  // 状態
  isLoading?: boolean;
  
  // スタイル
  style?: ViewStyle;
}

export const ShipNowPane: React.FC<ShipNowPaneProps> = ({
  departurePort = '現在地の港',
  arrivalPort = '目的地の港を選択してください',
  estimatedFare = 2400,
  estimatedTime = '約25分',
  passengers = 1,
  onPassengersChange = () => {},
  onConfirmBooking = () => {},
  onEditDeparture = () => {},
  onEditArrival = () => {},
  isLoading = false,
  style,
}) => {
  const {getAccentColor} = useTheme();
  const [selectedVesselType, setSelectedVesselType] = useState<'ferry' | 'jetfoil'>('ferry');

  const vesselTypes = [
    {
      id: 'ferry' as const,
      name: 'フェリー',
      description: '一般的な船舶・経済的',
      icon: '🚢',
      multiplier: 1,
      capacity: 200,
    },
    {
      id: 'jetfoil' as const,
      name: 'ジェットフォイル',
      description: '高速船・快適',
      icon: '🚤',
      multiplier: 1.8,
      capacity: 80,
    },
  ];

  const getAdjustedFare = () => {
    const selected = vesselTypes.find(v => v.id === selectedVesselType);
    const multiplier = selected?.multiplier || 1;
    return Math.round(estimatedFare * multiplier * passengers);
  };

  const incrementPassengers = () => {
    if (passengers < 8) {
      onPassengersChange(passengers + 1);
    }
  };

  const decrementPassengers = () => {
    if (passengers > 1) {
      onPassengersChange(passengers - 1);
    }
  };

  return (
    <ScrollView style={[styles.container, style]} showsVerticalScrollIndicator={false}>
      
      {/* ルート情報 */}
      <View style={styles.routeSection}>
        <Text style={styles.sectionTitle}>航路確認</Text>
        
        {/* 出発港 */}
        <TouchableOpacity 
          style={styles.portItem}
          onPress={onEditDeparture}
          activeOpacity={0.7}>
          <View style={styles.portIconContainer}>
            <Text style={styles.departureIcon}>🚢</Text>
          </View>
          <View style={styles.portContent}>
            <Text style={styles.portLabel}>出発港</Text>
            <Text style={styles.portText} numberOfLines={2}>
              {departurePort}
            </Text>
          </View>
          <Text style={styles.editIcon}>✏️</Text>
        </TouchableOpacity>

        {/* 航路矢印 */}
        <View style={styles.arrowContainer}>
          <Text style={styles.arrow}>⚓</Text>
          <View style={styles.waveLine} />
          <Text style={styles.arrow}>⚓</Text>
        </View>

        {/* 到着港 */}
        <TouchableOpacity 
          style={styles.portItem}
          onPress={onEditArrival}
          activeOpacity={0.7}>
          <View style={styles.portIconContainer}>
            <Text style={styles.arrivalIcon}>🏖️</Text>
          </View>
          <View style={styles.portContent}>
            <Text style={styles.portLabel}>到着港</Text>
            <Text style={styles.portText} numberOfLines={2}>
              {arrivalPort}
            </Text>
          </View>
          <Text style={styles.editIcon}>✏️</Text>
        </TouchableOpacity>
      </View>

      {/* 乗客数選択 */}
      <View style={styles.passengersSection}>
        <Text style={styles.sectionTitle}>乗客数</Text>
        <View style={styles.passengersControl}>
          <TouchableOpacity
            style={[styles.passengersButton, passengers <= 1 && styles.buttonDisabled]}
            onPress={decrementPassengers}
            disabled={passengers <= 1}
            activeOpacity={0.7}>
            <Text style={styles.passengersButtonText}>−</Text>
          </TouchableOpacity>
          
          <View style={styles.passengersDisplay}>
            <Text style={styles.passengersCount}>{passengers}</Text>
            <Text style={styles.passengersLabel}>名</Text>
          </View>
          
          <TouchableOpacity
            style={[styles.passengersButton, passengers >= 8 && styles.buttonDisabled]}
            onPress={incrementPassengers}
            disabled={passengers >= 8}
            activeOpacity={0.7}>
            <Text style={styles.passengersButtonText}>＋</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.passengersNote}>
          * 最大8名まで同時予約可能です
        </Text>
      </View>

      {/* 船舶タイプ選択 */}
      <View style={styles.vesselSection}>
        <Text style={styles.sectionTitle}>船舶タイプ</Text>
        {vesselTypes.map((vessel) => (
          <TouchableOpacity
            key={vessel.id}
            style={[
              styles.vesselOption,
              selectedVesselType === vessel.id && styles.vesselOptionSelected,
            ]}
            onPress={() => setSelectedVesselType(vessel.id)}
            activeOpacity={0.7}>
            <Text style={styles.vesselIcon}>{vessel.icon}</Text>
            <View style={styles.vesselContent}>
              <Text style={styles.vesselName}>{vessel.name}</Text>
              <Text style={styles.vesselDescription}>{vessel.description}</Text>
              <Text style={styles.vesselCapacity}>定員: {vessel.capacity}名</Text>
            </View>
            <View style={styles.vesselRadio}>
              {selectedVesselType === vessel.id && (
                <View style={[styles.radioSelected, {backgroundColor: getAccentColor()}]} />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* 料金見積 */}
      <View style={styles.fareSection}>
        <View style={styles.fareHeader}>
          <Text style={styles.sectionTitle}>料金見積</Text>
          <Text style={styles.estimatedTime}>{estimatedTime}</Text>
        </View>
        
        <View style={styles.fareCard}>
          <View style={styles.fareRow}>
            <Text style={styles.fareLabel}>乗船料金 ({passengers}名)</Text>
            <Text style={[styles.fareAmount, {color: getAccentColor()}]}>
              ¥{getAdjustedFare().toLocaleString()}
            </Text>
          </View>
          <Text style={styles.fareNote}>
            * 天候により運航状況が変更される場合があります
          </Text>
        </View>
      </View>

      {/* 予約ボタン */}
      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={[
            styles.bookingButton,
            {backgroundColor: getAccentColor()},
            isLoading && styles.buttonDisabled,
          ]}
          onPress={onConfirmBooking}
          disabled={isLoading}
          activeOpacity={0.8}>
          <Text style={styles.bookingButtonText}>
            {isLoading ? '船舶を予約中...' : 'すぐに乗船予約'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.scheduleButton} activeOpacity={0.7}>
          <Text style={[styles.scheduleButtonText, {color: getAccentColor()}]}>
            時刻表で予約
          </Text>
        </TouchableOpacity>
      </View>

      {/* 注意事項 */}
      <View style={styles.noticeSection}>
        <Text style={styles.noticeText}>
          • 出発15分前までに港にお越しください{'\n'}
          • 天候により運航が変更・中止になる場合があります{'\n'}
          • キャンセルは出発30分前まで可能です{'\n'}
          • 乗船券は当日港で受け取りください
        </Text>
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  sectionTitle: {
    ...GoTheme.typography.body,
    fontSize: 16,
    fontWeight: '600',
    color: GoTheme.colors.text,
    marginBottom: GoTheme.spacing.md,
  },

  // ルート情報
  routeSection: {
    marginBottom: GoTheme.spacing.lg,
  },
  
  portItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(240, 248, 255, 0.8)', // 船舶らしい青みがかった背景
    borderRadius: 12,
    padding: GoTheme.spacing.md,
    marginBottom: GoTheme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)', // 青系のボーダー
  },
  
  portIconContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: GoTheme.spacing.sm,
  },
  
  departureIcon: {
    fontSize: 18,
  },
  
  arrivalIcon: {
    fontSize: 18,
  },
  
  portContent: {
    flex: 1,
  },
  
  portLabel: {
    ...GoTheme.typography.caption,
    fontSize: 12,
    color: GoTheme.colors.textSecondary,
    marginBottom: 2,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  
  portText: {
    ...GoTheme.typography.body,
    fontSize: 14,
    color: GoTheme.colors.text,
    fontWeight: '500',
  },
  
  editIcon: {
    fontSize: 16,
    marginLeft: GoTheme.spacing.sm,
  },
  
  arrowContainer: {
    alignItems: 'center',
    paddingVertical: GoTheme.spacing.sm,
  },
  
  arrow: {
    fontSize: 16,
    color: '#3B82F6', // 船舶らしい青色
  },
  
  waveLine: {
    width: '60%',
    height: 2,
    backgroundColor: '#3B82F6',
    marginVertical: 4,
    borderRadius: 1,
    opacity: 0.6,
  },

  // 乗客数
  passengersSection: {
    marginBottom: GoTheme.spacing.lg,
  },
  
  passengersControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
    borderRadius: 12,
    padding: GoTheme.spacing.md,
    marginBottom: GoTheme.spacing.xs,
  },
  
  passengersButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GoTheme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    ...GoTheme.shadows.small,
  },
  
  passengersButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: GoTheme.colors.text,
  },
  
  passengersDisplay: {
    alignItems: 'center',
    marginHorizontal: GoTheme.spacing.lg,
  },
  
  passengersCount: {
    ...GoTheme.typography.body,
    fontSize: 32,
    fontWeight: '700',
    color: GoTheme.colors.text,
  },
  
  passengersLabel: {
    ...GoTheme.typography.caption,
    fontSize: 12,
    color: GoTheme.colors.textSecondary,
    fontWeight: '500',
  },
  
  passengersNote: {
    ...GoTheme.typography.caption,
    fontSize: 11,
    color: GoTheme.colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // 船舶タイプ
  vesselSection: {
    marginBottom: GoTheme.spacing.lg,
  },
  
  vesselOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(240, 248, 255, 0.8)',
    borderRadius: 12,
    padding: GoTheme.spacing.md,
    marginBottom: GoTheme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  
  vesselOptionSelected: {
    borderColor: GoTheme.colors.primary,
    backgroundColor: 'rgba(0, 82, 164, 0.05)',
  },
  
  vesselIcon: {
    fontSize: 24,
    width: 40,
    textAlign: 'center',
    marginRight: GoTheme.spacing.sm,
  },
  
  vesselContent: {
    flex: 1,
  },
  
  vesselName: {
    ...GoTheme.typography.body,
    fontSize: 15,
    fontWeight: '600',
    color: GoTheme.colors.text,
    marginBottom: 2,
  },
  
  vesselDescription: {
    ...GoTheme.typography.caption,
    fontSize: 12,
    color: GoTheme.colors.textSecondary,
    marginBottom: 2,
  },
  
  vesselCapacity: {
    ...GoTheme.typography.caption,
    fontSize: 11,
    color: '#3B82F6',
    fontWeight: '500',
  },
  
  vesselRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: GoTheme.colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // 料金見積
  fareSection: {
    marginBottom: GoTheme.spacing.lg,
  },
  
  fareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: GoTheme.spacing.md,
  },
  
  estimatedTime: {
    ...GoTheme.typography.caption,
    color: GoTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  
  fareCard: {
    backgroundColor: 'rgba(240, 248, 255, 0.8)',
    borderRadius: 12,
    padding: GoTheme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: GoTheme.spacing.xs,
  },
  
  fareLabel: {
    ...GoTheme.typography.body,
    fontSize: 14,
    color: GoTheme.colors.text,
    fontWeight: '500',
  },
  
  fareAmount: {
    ...GoTheme.typography.body,
    fontSize: 18,
    fontWeight: '700',
  },
  
  fareNote: {
    ...GoTheme.typography.caption,
    fontSize: 11,
    color: GoTheme.colors.textSecondary,
    fontStyle: 'italic',
  },

  // ボタン
  buttonSection: {
    marginBottom: GoTheme.spacing.lg,
  },
  
  bookingButton: {
    borderRadius: 16,
    paddingVertical: GoTheme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: GoTheme.spacing.sm,
    ...GoTheme.shadows.medium,
  },
  
  buttonDisabled: {
    opacity: 0.5,
  },
  
  bookingButtonText: {
    ...GoTheme.typography.button,
    color: GoTheme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  
  scheduleButton: {
    borderRadius: 16,
    paddingVertical: GoTheme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: GoTheme.colors.primary,
    backgroundColor: 'transparent',
  },
  
  scheduleButtonText: {
    ...GoTheme.typography.button,
    fontSize: 15,
    fontWeight: '500',
  },

  // 注意事項
  noticeSection: {
    paddingBottom: GoTheme.spacing.lg,
  },
  
  noticeText: {
    ...GoTheme.typography.caption,
    fontSize: 12,
    color: GoTheme.colors.textSecondary,
    lineHeight: 18,
  },
});