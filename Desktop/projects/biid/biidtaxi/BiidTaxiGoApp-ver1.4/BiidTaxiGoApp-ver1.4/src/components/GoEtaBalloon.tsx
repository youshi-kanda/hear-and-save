import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import {GoTheme} from '../theme/GoTheme';
import {useTheme} from '../contexts/ThemeContext';

export interface GoEtaBalloonProps {
  etaRange?: string;
  isLoading?: boolean;
  style?: ViewStyle;
  position?: 'top' | 'bottom';
}

export const GoEtaBalloon: React.FC<GoEtaBalloonProps> = ({
  etaRange = '1–4',
  isLoading = false,
  style,
  position = 'bottom',
}) => {
  const {currentMode} = useTheme();

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingBar} />
        </View>
      );
    }

    // GOタクシー仕様: 時間部分を青文字で強調、ベーステキストは黒
    const timeText = `${etaRange}分`;
    
    return (
      <Text style={styles.etaText}>
        約<Text style={styles.timeHighlight}>{timeText}</Text>
      </Text>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {/* Balloon content */}
      <View style={[
        styles.balloon,
        position === 'top' && styles.balloonTop
      ]}>
        {renderContent()}
      </View>
      
      {/* Balloon arrow/tail */}
      <View style={[
        styles.arrow,
        position === 'top' ? styles.arrowDown : styles.arrowUp
      ]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    zIndex: 999,
  },
  
  // Main balloon container（GO仕様: 白い吹き出し＋影付き）
  balloon: {
    backgroundColor: '#ffffff', // GOタクシー仕様: 白背景
    paddingVertical: GoTheme.spacing.sm, // 8
    paddingHorizontal: GoTheme.spacing.md, // 16
    borderRadius: GoTheme.borderRadius.md, // 12 -> 丸みを強調
    marginBottom: GoTheme.spacing.xs, // 4
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15, // 影を強調
    shadowRadius: 8,
    elevation: 5, // 影を強調
    minWidth: 100,
    alignItems: 'center',
  },
  
  balloonTop: {
    marginTop: GoTheme.spacing.xs, // 4 -> 統一
    marginBottom: 0,
  },
  
  // Balloon text（GO仕様: 白背景に黒文字）
  etaText: {
    color: '#333333', // GOタクシー仕様: 黒文字
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
  },
  
  // 時間部分の青文字強調
  timeHighlight: {
    color: GoTheme.colors.primary, // GOタクシー仕様: 青文字（#2A78FF）
    fontWeight: '700',
  },
  
  // Loading state
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 16,
  },
  
  loadingBar: {
    width: 60,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
  },
  
  // Arrow pointing to pin
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  
  arrowUp: {
    borderBottomWidth: 6,
    borderBottomColor: '#ffffff', // 白背景に合わせて変更
  },
  
  arrowDown: {
    borderTopWidth: 6,
    borderTopColor: '#ffffff', // 白背景に合わせて変更
  },
});