import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {GoTheme} from '../theme/GoTheme';

const { width } = Dimensions.get('window');

export interface FixedBottomSheetProps {
  pickupLocation?: string;
  destinationLocation?: string;
  onPickupPress?: () => void;
  onDestinationPress?: () => void;
  onNextPress?: () => void;
  isNextEnabled?: boolean;
}

export const FixedBottomSheet: React.FC<FixedBottomSheetProps> = ({
  pickupLocation = '位置情報を取得中...',
  destinationLocation,
  onPickupPress,
  onDestinationPress,
  onNextPress,
  isNextEnabled = false,
}) => {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 20);

  return (
    <View style={[styles.container, { paddingBottom: bottomPadding + 60 }]}>
      {/* 乗車地セクション */}
      <TouchableOpacity 
        style={styles.locationSection}
        onPress={onPickupPress}
        activeOpacity={0.7}
      >
        <View style={styles.locationIcon}>
          <Text style={styles.personIcon}>👤</Text>
        </View>
        <View style={styles.locationContent}>
          <Text style={styles.locationLabel}>乗車地</Text>
          <Text style={styles.locationAddress} numberOfLines={1}>
            {pickupLocation}
          </Text>
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={onPickupPress}>
          <Text style={styles.searchButtonText}>検索</Text>
        </TouchableOpacity>
      </TouchableOpacity>

      {/* 区切り線 */}
      <View style={styles.divider} />

      {/* 目的地セクション */}
      <TouchableOpacity 
        style={styles.locationSection}
        onPress={onDestinationPress}
        activeOpacity={0.7}
      >
        <View style={styles.locationIcon}>
          <Text style={styles.destinationPinIcon}>📍</Text>
        </View>
        <View style={styles.locationContent}>
          <Text style={styles.locationLabel}>目的地</Text>
          <Text style={[
            styles.locationAddress, 
            !destinationLocation && styles.placeholderText
          ]} numberOfLines={1}>
            {destinationLocation || '指定なし'}
          </Text>
        </View>
        {/* 次へボタン */}
        <TouchableOpacity 
          style={[
            styles.nextButton,
            isNextEnabled && styles.nextButtonEnabled
          ]}
          onPress={onNextPress}
          disabled={!isNextEnabled}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.nextButtonText,
            isNextEnabled && styles.nextButtonTextEnabled
          ]}>
            次へ
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff', // 完全な白色
    paddingTop: GoTheme.spacing.lg, // 20 -> より大きな余白
    paddingHorizontal: GoTheme.spacing.lg, // 20 -> より大きな余白
    borderTopLeftRadius: 20, // GOタクシー仕様: 角丸大きめ
    borderTopRightRadius: 20, // GOタクシー仕様: 角丸大きめ
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, // より強めのシャドウ
    shadowRadius: 12,
    elevation: 8, // より強めのシャドウ
  },

  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: GoTheme.spacing.md, // 16 -> より大きな縦余白
    minHeight: 60, // 60 -> より高さ
  },

  locationIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: GoTheme.spacing.md, // 16 -> より大きなマージン
  },

  personIcon: {
    fontSize: 20,
    color: GoTheme.colors.primary, // #2A78FF - GOタクシーブルー
  },

  destinationPinIcon: {
    fontSize: 20,
    color: GoTheme.colors.primary, // #2A78FF - GOタクシーブルー（青い場所ピン）
  },

  locationContent: {
    flex: 1,
    marginRight: GoTheme.spacing.md, // 16 -> より大きなマージン
  },

  locationLabel: {
    ...GoTheme.typography.caption,
    color: GoTheme.colors.textSecondary,
    marginBottom: 4,
    fontSize: 12,
  },

  locationAddress: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.text,
    fontWeight: '500',
    fontSize: 16,
  },

  placeholderText: {
    color: GoTheme.colors.textSecondary,
    fontWeight: '400',
  },

  searchButton: {
    paddingHorizontal: GoTheme.spacing.md,
    paddingVertical: GoTheme.spacing.xs,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: GoTheme.colors.border,
    borderRadius: GoTheme.borderRadius.sm,
  },

  searchButtonText: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.primary,
    fontWeight: '500',
  },

  nextButton: {
    width: 120, // GOタクシー仕様: 固定幅で丸みを強調
    height: 48, // より大きなボタン
    borderRadius: 24, // 丸みを強調（半円形）
    backgroundColor: GoTheme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },

  nextButtonEnabled: {
    backgroundColor: GoTheme.colors.primary, // #2A78FF - GOタクシーブルー
    shadowColor: GoTheme.colors.primary,
    shadowOpacity: 0.25,
    elevation: 6,
  },

  nextButtonText: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.textSecondary,
    fontWeight: '600',
    fontSize: 16,
  },

  nextButtonTextEnabled: {
    color: '#ffffff', // 白色
    fontWeight: '700',
  },

  divider: {
    height: 1,
    backgroundColor: GoTheme.colors.border,
    marginLeft: 48, // アイコン分のインデント
    marginVertical: GoTheme.spacing.xs,
  },
});

export default FixedBottomSheet;