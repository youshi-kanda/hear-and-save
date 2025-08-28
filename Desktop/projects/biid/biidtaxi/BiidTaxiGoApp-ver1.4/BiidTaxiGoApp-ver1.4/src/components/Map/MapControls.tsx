import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { GoTheme } from '../../theme/GoTheme';

interface MapControlsProps {
  onCurrentLocationPress: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  showLocationButton?: boolean;
  showZoomControls?: boolean;
  style?: any;
}

export const MapControls: React.FC<MapControlsProps> = ({
  onCurrentLocationPress,
  onZoomIn,
  onZoomOut,
  showLocationButton = true,
  showZoomControls = true,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* ズームコントロール */}
      {showZoomControls && (
        <View style={styles.zoomControls}>
          <TouchableOpacity
            style={[styles.zoomButton, styles.zoomButtonTop]}
            onPress={onZoomIn}
            activeOpacity={0.7}
          >
            <Text style={styles.zoomButtonText}>+</Text>
          </TouchableOpacity>
          <View style={styles.zoomSeparator} />
          <TouchableOpacity
            style={[styles.zoomButton, styles.zoomButtonBottom]}
            onPress={onZoomOut}
            activeOpacity={0.7}
          >
            <Text style={styles.zoomButtonText}>−</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 現在地ボタン */}
      {showLocationButton && (
        <TouchableOpacity
          style={styles.currentLocationButton}
          onPress={onCurrentLocationPress}
          activeOpacity={0.8}
        >
          <View style={styles.currentLocationIcon}>
            <View style={styles.currentLocationDot} />
            <View style={styles.currentLocationRing} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

// 現在地FABボタン（単体使用）
export const CurrentLocationFAB: React.FC<{
  onPress: () => void;
  style?: any;
}> = ({ onPress, style }) => (
  <TouchableOpacity
    style={[styles.fab, style]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={styles.fabIcon}>
      <View style={styles.currentLocationDot} />
      <View style={styles.currentLocationRing} />
    </View>
  </TouchableOpacity>
);

// マップタイプ切り替えボタン
export const MapTypeToggle: React.FC<{
  mapType: 'standard' | 'satellite' | 'hybrid';
  onMapTypeChange: (type: 'standard' | 'satellite' | 'hybrid') => void;
  style?: any;
}> = ({ mapType, onMapTypeChange, style }) => (
  <View style={[styles.mapTypeContainer, style]}>
    <TouchableOpacity
      style={[
        styles.mapTypeButton,
        styles.mapTypeButtonLeft,
        mapType === 'standard' && styles.mapTypeButtonActive,
      ]}
      onPress={() => onMapTypeChange('standard')}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.mapTypeText,
        mapType === 'standard' && styles.mapTypeTextActive,
      ]}>
        地図
      </Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[
        styles.mapTypeButton,
        styles.mapTypeButtonRight,
        mapType === 'satellite' && styles.mapTypeButtonActive,
      ]}
      onPress={() => onMapTypeChange('satellite')}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.mapTypeText,
        mapType === 'satellite' && styles.mapTypeTextActive,
      ]}>
        衛星
      </Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: GoTheme.spacing.md,
    bottom: 120, // ボトムナビゲーションの上
    alignItems: 'flex-end',
  },

  // ズームコントロール
  zoomControls: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: GoTheme.borderRadius.md,
    marginBottom: GoTheme.spacing.sm,
    overflow: 'hidden',
    ...GoTheme.shadows.small,
  },
  zoomButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  zoomButtonTop: {
    borderTopLeftRadius: GoTheme.borderRadius.md,
    borderTopRightRadius: GoTheme.borderRadius.md,
  },
  zoomButtonBottom: {
    borderBottomLeftRadius: GoTheme.borderRadius.md,
    borderBottomRightRadius: GoTheme.borderRadius.md,
  },
  zoomButtonText: {
    ...GoTheme.typography.h3,
    color: GoTheme.colors.text,
    fontWeight: '300',
  },
  zoomSeparator: {
    height: 1,
    backgroundColor: GoTheme.colors.border,
    marginHorizontal: GoTheme.spacing.sm,
  },

  // 現在地ボタン
  currentLocationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    ...GoTheme.shadows.small,
  },
  currentLocationIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentLocationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GoTheme.colors.primary,
    position: 'absolute',
  },
  currentLocationRing: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: GoTheme.colors.primary,
    backgroundColor: 'transparent',
  },

  // FABボタン
  fab: {
    width: GoTheme.go.fabSize,
    height: GoTheme.go.fabSize,
    borderRadius: GoTheme.go.fabSize / 2,
    backgroundColor: GoTheme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...GoTheme.shadows.fab,
  },
  fabIcon: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // マップタイプ切り替え
  mapTypeContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: GoTheme.borderRadius.md,
    overflow: 'hidden',
    ...GoTheme.shadows.small,
  },
  mapTypeButton: {
    paddingHorizontal: GoTheme.spacing.md,
    paddingVertical: GoTheme.spacing.sm,
    backgroundColor: 'transparent',
  },
  mapTypeButtonLeft: {
    borderTopLeftRadius: GoTheme.borderRadius.md,
    borderBottomLeftRadius: GoTheme.borderRadius.md,
  },
  mapTypeButtonRight: {
    borderTopRightRadius: GoTheme.borderRadius.md,
    borderBottomRightRadius: GoTheme.borderRadius.md,
  },
  mapTypeButtonActive: {
    backgroundColor: GoTheme.colors.primary,
  },
  mapTypeText: {
    ...GoTheme.typography.captionSmall,
    color: GoTheme.colors.text,
    fontWeight: '500',
  },
  mapTypeTextActive: {
    color: GoTheme.colors.textOnPrimary,
  },
});

export default MapControls;