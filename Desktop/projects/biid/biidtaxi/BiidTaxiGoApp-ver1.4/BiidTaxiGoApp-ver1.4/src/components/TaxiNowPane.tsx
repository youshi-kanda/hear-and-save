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

export interface TaxiNowPaneProps {
  // 乗車地・目的地情報
  pickupAddress?: string;
  destinationAddress?: string;
  
  // 料金見積
  estimatedFare?: {
    min: number;
    max: number;
  };
  estimatedTime?: string;
  
  // コールバック
  onConfirmBooking?: () => void;
  onEditPickup?: () => void;
  onEditDestination?: () => void;
  
  // 状態
  isLoading?: boolean;
  
  // スタイル
  style?: ViewStyle;
}

export const TaxiNowPane: React.FC<TaxiNowPaneProps> = ({
  pickupAddress = '現在地',
  destinationAddress = '目的地を選択してください',
  estimatedFare = {min: 800, max: 1200},
  estimatedTime = '約8分',
  onConfirmBooking = () => {},
  onEditPickup = () => {},
  onEditDestination = () => {},
  isLoading = false,
  style,
}) => {
  const {getAccentColor} = useTheme();
  const [selectedVehicleType, setSelectedVehicleType] = useState<'standard' | 'premium' | 'van'>('standard');

  const vehicleTypes = [
    {
      id: 'standard' as const,
      name: 'スタンダード',
      description: '一般的なタクシー',
      icon: '🚗',
      multiplier: 1,
    },
    {
      id: 'premium' as const,
      name: 'プレミアム',
      description: '快適な上級車',
      icon: '🚙',
      multiplier: 1.3,
    },
    {
      id: 'van' as const,
      name: 'バン',
      description: '大人数・荷物多め',
      icon: '🚐',
      multiplier: 1.5,
    },
  ];

  const getAdjustedFare = () => {
    const selected = vehicleTypes.find(v => v.id === selectedVehicleType);
    const multiplier = selected?.multiplier || 1;
    return {
      min: Math.round(estimatedFare.min * multiplier),
      max: Math.round(estimatedFare.max * multiplier),
    };
  };

  return (
    <ScrollView style={[styles.container, style]} showsVerticalScrollIndicator={false}>
      
      {/* ルート情報 */}
      <View style={styles.routeSection}>
        <Text style={styles.sectionTitle}>ルート確認</Text>
        
        {/* 乗車地 */}
        <TouchableOpacity 
          style={styles.addressItem}
          onPress={onEditPickup}
          activeOpacity={0.7}>
          <View style={styles.addressIconContainer}>
            <Text style={styles.pickupIcon}>📍</Text>
          </View>
          <View style={styles.addressContent}>
            <Text style={styles.addressLabel}>乗車地</Text>
            <Text style={styles.addressText} numberOfLines={2}>
              {pickupAddress}
            </Text>
          </View>
          <Text style={styles.editIcon}>✏️</Text>
        </TouchableOpacity>

        {/* 矢印 */}
        <View style={styles.arrowContainer}>
          <Text style={styles.arrow}>↓</Text>
        </View>

        {/* 目的地 */}
        <TouchableOpacity 
          style={styles.addressItem}
          onPress={onEditDestination}
          activeOpacity={0.7}>
          <View style={styles.addressIconContainer}>
            <Text style={styles.destinationIcon}>🎯</Text>
          </View>
          <View style={styles.addressContent}>
            <Text style={styles.addressLabel}>目的地</Text>
            <Text style={styles.addressText} numberOfLines={2}>
              {destinationAddress}
            </Text>
          </View>
          <Text style={styles.editIcon}>✏️</Text>
        </TouchableOpacity>
      </View>

      {/* 車両タイプ選択 */}
      <View style={styles.vehicleSection}>
        <Text style={styles.sectionTitle}>車両タイプ</Text>
        {vehicleTypes.map((vehicle) => (
          <TouchableOpacity
            key={vehicle.id}
            style={[
              styles.vehicleOption,
              selectedVehicleType === vehicle.id && styles.vehicleOptionSelected,
            ]}
            onPress={() => setSelectedVehicleType(vehicle.id)}
            activeOpacity={0.7}>
            <Text style={styles.vehicleIcon}>{vehicle.icon}</Text>
            <View style={styles.vehicleContent}>
              <Text style={styles.vehicleName}>{vehicle.name}</Text>
              <Text style={styles.vehicleDescription}>{vehicle.description}</Text>
            </View>
            <View style={styles.vehicleRadio}>
              {selectedVehicleType === vehicle.id && (
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
            <Text style={styles.fareLabel}>予想料金</Text>
            <Text style={[styles.fareAmount, {color: getAccentColor()}]}>
              ¥{getAdjustedFare().min.toLocaleString()} - ¥{getAdjustedFare().max.toLocaleString()}
            </Text>
          </View>
          <Text style={styles.fareNote}>
            * 実際の料金は交通状況により変動する場合があります
          </Text>
        </View>
      </View>

      {/* 呼び出しボタン */}
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
            {isLoading ? 'タクシーを呼んでいます...' : 'タクシーを呼ぶ'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.scheduleButton} activeOpacity={0.7}>
          <Text style={[styles.scheduleButtonText, {color: getAccentColor()}]}>
            時間指定で予約
          </Text>
        </TouchableOpacity>
      </View>

      {/* 注意事項 */}
      <View style={styles.noticeSection}>
        <Text style={styles.noticeText}>
          • タクシーの到着までお待ちください{'\n'}
          • ドライバーから連絡があった場合は応答してください{'\n'}
          • キャンセルは乗車前まで可能です
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
  
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GoTheme.colors.surface,
    borderRadius: GoTheme.borderRadius.lg,
    padding: GoTheme.spacing.md,
    marginBottom: GoTheme.spacing.sm,
    borderWidth: 1,
    borderColor: GoTheme.colors.border,
    ...GoTheme.shadows.small,
  },
  
  addressIconContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: GoTheme.spacing.sm,
  },
  
  pickupIcon: {
    fontSize: 18,
  },
  
  destinationIcon: {
    fontSize: 18,
  },
  
  addressContent: {
    flex: 1,
  },
  
  addressLabel: {
    ...GoTheme.typography.caption,
    fontSize: 12,
    color: GoTheme.colors.textSecondary,
    marginBottom: 2,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  
  addressText: {
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
    paddingVertical: GoTheme.spacing.xs,
  },
  
  arrow: {
    fontSize: 20,
    color: GoTheme.colors.textSecondary,
  },

  // 車両タイプ
  vehicleSection: {
    marginBottom: GoTheme.spacing.lg,
  },
  
  vehicleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GoTheme.colors.surface,
    borderRadius: GoTheme.borderRadius.lg,
    padding: GoTheme.spacing.md,
    marginBottom: GoTheme.spacing.sm,
    borderWidth: 1,
    borderColor: GoTheme.colors.border,
    ...GoTheme.shadows.small,
  },
  
  vehicleOptionSelected: {
    borderColor: GoTheme.colors.primaryLight,
    borderWidth: 2,
    backgroundColor: GoTheme.colors.surface,
    ...GoTheme.shadows.medium,
  },
  
  vehicleIcon: {
    fontSize: 24,
    width: 40,
    textAlign: 'center',
    marginRight: GoTheme.spacing.sm,
  },
  
  vehicleContent: {
    flex: 1,
  },
  
  vehicleName: {
    ...GoTheme.typography.body,
    fontSize: 15,
    fontWeight: '600',
    color: GoTheme.colors.text,
    marginBottom: 2,
  },
  
  vehicleDescription: {
    ...GoTheme.typography.caption,
    fontSize: 12,
    color: GoTheme.colors.textSecondary,
  },
  
  vehicleRadio: {
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
    backgroundColor: GoTheme.colors.surface,
    borderRadius: GoTheme.borderRadius.lg,
    padding: GoTheme.spacing.md,
    borderWidth: 1,
    borderColor: GoTheme.colors.border,
    ...GoTheme.shadows.medium,
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
    borderRadius: GoTheme.borderRadius.lg,
    paddingVertical: GoTheme.spacing.lg,
    paddingHorizontal: GoTheme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: GoTheme.spacing.sm,
    minHeight: GoTheme.go.buttonHeight.large,
    ...GoTheme.shadows.pill,
  },
  
  buttonDisabled: {
    opacity: 0.7,
  },
  
  bookingButtonText: {
    ...GoTheme.typography.button,
    color: GoTheme.colors.textOnPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  scheduleButton: {
    borderRadius: GoTheme.borderRadius.lg,
    paddingVertical: GoTheme.spacing.lg,
    paddingHorizontal: GoTheme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: GoTheme.colors.primaryLight,
    backgroundColor: 'transparent',
    minHeight: GoTheme.go.buttonHeight.large,
  },
  
  scheduleButtonText: {
    ...GoTheme.typography.button,
    fontSize: 16,
    fontWeight: '600',
    color: GoTheme.colors.primaryLight,
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