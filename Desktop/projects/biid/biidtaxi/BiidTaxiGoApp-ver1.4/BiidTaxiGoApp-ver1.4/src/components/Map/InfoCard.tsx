import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { GoTheme } from '../../theme/GoTheme';

interface InfoCardProps {
  title?: string;
  subtitle?: string;
  description?: string;
  eta?: string;
  distance?: string;
  onPress?: () => void;
  onClose?: () => void;
  style?: ViewStyle;
  children?: React.ReactNode;
  showArrow?: boolean;
  variant?: 'default' | 'taxi' | 'location' | 'route';
}

export const InfoCard: React.FC<InfoCardProps> = ({
  title,
  subtitle,
  description,
  eta,
  distance,
  onPress,
  onClose,
  style,
  children,
  showArrow = true,
  variant = 'default',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'taxi':
        return {
          borderColor: GoTheme.colors.taxiAccent,
          borderWidth: 1,
        };
      case 'location':
        return {
          borderColor: GoTheme.colors.primary,
          borderWidth: 1,
        };
      case 'route':
        return {
          backgroundColor: GoTheme.colors.primaryLight,
        };
      default:
        return {};
    }
  };

  const CardContent = (
    <View style={[styles.container, getVariantStyles(), style]}>
      {/* ヘッダー部分 */}
      {(title || onClose) && (
        <View style={styles.header}>
          {title && <Text style={styles.title}>{title}</Text>}
          {onClose && (
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* サブタイトル */}
      {subtitle && (
        <Text style={styles.subtitle}>{subtitle}</Text>
      )}

      {/* ETA・距離情報 */}
      {(eta || distance) && (
        <View style={styles.metaContainer}>
          {eta && (
            <View style={styles.metaItem}>
              <Text style={styles.etaLabel}>約</Text>
              <Text style={styles.etaValue}>{eta}</Text>
              <Text style={styles.etaLabel}>で到着</Text>
            </View>
          )}
          {distance && (
            <View style={styles.metaItem}>
              <Text style={styles.distanceValue}>{distance}</Text>
            </View>
          )}
        </View>
      )}

      {/* 説明文 */}
      {description && (
        <Text style={styles.description}>{description}</Text>
      )}

      {/* カスタムコンテンツ */}
      {children}

      {/* 矢印（必要な場合） */}
      {showArrow && (
        <View style={styles.arrow} />
      )}
    </View>
  );

  // タップ可能な場合はTouchableOpacityでラップ
  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={styles.touchable}
      >
        {CardContent}
      </TouchableOpacity>
    );
  }

  return CardContent;
};

// 特定用途向けのプリセットカード
export const TaxiInfoCard: React.FC<{
  eta: string;
  distance?: string;
  licensePlate?: string;
  driverName?: string;
  onPress?: () => void;
  style?: ViewStyle;
}> = ({ eta, distance, licensePlate, driverName, onPress, style }) => (
  <InfoCard
    variant="taxi"
    eta={eta}
    distance={distance}
    onPress={onPress}
    style={style}
  >
    {(licensePlate || driverName) && (
      <View style={styles.driverInfo}>
        {driverName && (
          <Text style={styles.driverName}>{driverName}</Text>
        )}
        {licensePlate && (
          <Text style={styles.licensePlate}>{licensePlate}</Text>
        )}
      </View>
    )}
  </InfoCard>
);

export const LocationInfoCard: React.FC<{
  title: string;
  address?: string;
  onPress?: () => void;
  onClose?: () => void;
  style?: ViewStyle;
}> = ({ title, address, onPress, onClose, style }) => (
  <InfoCard
    variant="location"
    title={title}
    description={address}
    onPress={onPress}
    onClose={onClose}
    style={style}
  />
);

const styles = StyleSheet.create({
  touchable: {
    // TouchableOpacityのスタイル（必要に応じて）
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: GoTheme.borderRadius.lg,
    padding: GoTheme.spacing.md,
    marginHorizontal: GoTheme.spacing.sm,
    marginVertical: GoTheme.spacing.xs,
    ...GoTheme.shadows.medium,
    position: 'relative',
    minWidth: 200,
    maxWidth: 320,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: GoTheme.spacing.xs,
  },
  title: {
    ...GoTheme.typography.h4,
    color: GoTheme.colors.text,
    flex: 1,
    marginRight: GoTheme.spacing.sm,
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: GoTheme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.textSecondary,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  subtitle: {
    ...GoTheme.typography.bodySmall,
    color: GoTheme.colors.textSecondary,
    marginBottom: GoTheme.spacing.xs,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: GoTheme.spacing.sm,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: GoTheme.spacing.md,
  },
  etaLabel: {
    ...GoTheme.typography.caption,
    color: GoTheme.colors.text,
    marginHorizontal: 2,
  },
  etaValue: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.primary,
    fontWeight: '600',
    marginHorizontal: 2,
  },
  distanceValue: {
    ...GoTheme.typography.caption,
    color: GoTheme.colors.textSecondary,
    fontWeight: '500',
  },
  description: {
    ...GoTheme.typography.bodySmall,
    color: GoTheme.colors.textSecondary,
    lineHeight: 18,
  },
  arrow: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    marginLeft: -8,
    width: 16,
    height: 16,
    backgroundColor: '#ffffff',
    transform: [{ rotate: '45deg' }],
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  // タクシー情報専用スタイル
  driverInfo: {
    marginTop: GoTheme.spacing.sm,
    paddingTop: GoTheme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: GoTheme.colors.divider,
  },
  driverName: {
    ...GoTheme.typography.bodySmall,
    color: GoTheme.colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  licensePlate: {
    ...GoTheme.typography.captionSmall,
    color: GoTheme.colors.textSecondary,
    fontFamily: 'monospace',
    backgroundColor: GoTheme.colors.secondaryDark,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
});

export default InfoCard;