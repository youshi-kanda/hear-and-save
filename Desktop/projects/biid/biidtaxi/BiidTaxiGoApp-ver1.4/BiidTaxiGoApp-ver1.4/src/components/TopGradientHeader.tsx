import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, ViewStyle, StatusBar} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {GoTheme} from '../theme/GoTheme';

export interface TopGradientHeaderProps {
  onMenuPress?: () => void;
  onProfilePress?: () => void;
  style?: ViewStyle;
  showMenuButton?: boolean;
  showProfileButton?: boolean;
  userName?: string;
  planName?: string;
}

export const TopGradientHeader: React.FC<TopGradientHeaderProps> = ({
  onMenuPress,
  onProfilePress,
  style,
  showMenuButton = true,
  showProfileButton = true,
  userName = 'ユーザー',
  planName = 'GO Basic',
}) => {
  const insets = useSafeAreaInsets();

  return (
    <>
      <StatusBar 
        backgroundColor="transparent"
        barStyle="dark-content" 
        translucent 
      />
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)', 'rgba(255, 255, 255, 0.0)']} // GOタクシー仕様: 半透明白グラデーション
        angle={180}
        style={[
          styles.container,
          {
            height: 92 + insets.top, // GO仕様: 92-96dp + SafeArea
            paddingTop: insets.top,
          },
          style,
        ]}
      >
        <View style={styles.content}>
          {/* 左側: ハンバーガーメニュー + ユーザー名 + プランバッジ */}
          <View style={styles.leftSection}>
            <View style={styles.leftContent}>
              {showMenuButton && onMenuPress && (
                <TouchableOpacity
                  style={styles.hamburgerButton}
                  onPress={onMenuPress}
                  activeOpacity={0.7}
                >
                  <Text style={styles.hamburgerText}>☰</Text>
                </TouchableOpacity>
              )}
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{userName}</Text>
                <View style={styles.planBadge}>
                  <Text style={styles.planText}>{planName}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 中央: 空白（GOアプリ見本に合わせてシンプルに） */}
          <View style={styles.centerSection} />

          {/* 右側: プロフィールボタン */}
          <View style={styles.rightSection}>
            {showProfileButton && onProfilePress && (
              <TouchableOpacity
                style={styles.profileButton}
                onPress={onProfilePress}
                activeOpacity={0.7}
              >
                <Text style={styles.profileText}>👤</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: GoTheme.spacing.md,
    paddingBottom: GoTheme.spacing.sm,
    marginTop: GoTheme.spacing.sm,
  },
  leftSection: {
    flex: 3, // より多くのスペースを確保
    alignItems: 'flex-start',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  hamburgerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: GoTheme.spacing.sm,
  },
  hamburgerText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...GoTheme.typography.body,
    color: '#333333',
    fontWeight: '600',
    marginBottom: 2,
  },
  planBadge: {
    backgroundColor: GoTheme.colors.primary, // #2A78FF
    borderRadius: GoTheme.borderRadius.sm,
    paddingHorizontal: GoTheme.spacing.xs,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  planText: {
    ...GoTheme.typography.captionSmall,
    color: '#ffffff',
    fontWeight: '600',
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
});

export default TopGradientHeader;