import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import {GoTheme} from '../theme/GoTheme';
import {useTheme} from '../contexts/ThemeContext';

export interface MapFABsProps {
  // 現在地FAB
  onRecenter?: () => void;
  isRecentering?: boolean;
  
  // メニューFAB (オプション)
  onMenu?: () => void;
  showMenuFAB?: boolean;
  
  // スタイル
  style?: ViewStyle;
  bottomOffset?: number;
  rightOffset?: number;
}

export const MapFABs: React.FC<MapFABsProps> = ({
  onRecenter = () => {},
  isRecentering = false,
  onMenu,
  showMenuFAB = false,
  style,
  bottomOffset = 20,
  rightOffset = 16,
}) => {
  const {getAccentColor} = useTheme();

  return (
    <View 
      style={[
        styles.container, 
        {
          bottom: bottomOffset,
          right: rightOffset,
        },
        style
      ]} 
      pointerEvents="box-none">
      
      {/* メニューFAB（上側・オプション） */}
      {showMenuFAB && onMenu && (
        <TouchableOpacity
          style={[styles.fab, styles.menuFab]}
          onPress={onMenu}
          activeOpacity={0.8}>
          <Text style={styles.menuIcon}>≡</Text>
        </TouchableOpacity>
      )}
      
      {/* 現在地FAB（下側・メイン - GO style） */}
      <TouchableOpacity
        style={[
          styles.fab,
          styles.mainFab,
          isRecentering && styles.fabLoading,
        ]}
        onPress={onRecenter}
        activeOpacity={0.8}
        disabled={isRecentering}>
        
        {isRecentering ? (
          <ActivityIndicator 
            size="small" 
            color={getAccentColor()} 
          />
        ) : (
          <Text style={[styles.locationIcon, {color: getAccentColor()}]}>🎯</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 1000,
  },
  
  // 基本FABスタイル（GO-style更新）
  fab: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: GoTheme.colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  
  // メニューFAB（GO-style）
  menuFab: {
    backgroundColor: GoTheme.colors.white,
    marginBottom: GoTheme.spacing.sm,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  menuIcon: {
    fontSize: 20,
    color: GoTheme.colors.text,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  
  // メイン現在地FAB（GO-style white background）
  mainFab: {
    backgroundColor: GoTheme.colors.white, // GO-style white background
    width: 44, // GO-style size 40-48px
    height: 44,
    borderRadius: 22, // Perfect circle
    shadowColor: GoTheme.colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  locationIcon: {
    fontSize: 18,
    lineHeight: 18,
  },
  
  // ローディング状態
  fabLoading: {
    opacity: 0.7,
  },
});