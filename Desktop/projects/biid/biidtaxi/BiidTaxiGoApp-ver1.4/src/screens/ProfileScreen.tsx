import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import {GoButton, GoCard, GoHeader} from '../components/GoStyle';
import {GoTheme} from '../theme/GoTheme';
import {userService, UserProfile} from '../services/api/userService';

export interface ProfileScreenProps {
  navigation: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({navigation}) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // プロフィール取得
  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const response = await userService.getProfile();
      
      if (response.success && response.data) {
        setUserProfile(response.data);
      } else {
        // フォールバック用モックデータ
        setUserProfile({
          id: '1',
          email: 'tanaka@example.com',
          first_name: '太郎',
          last_name: '田中',
          phone: '090-1234-5678',
          membership_level: 'gold',
          total_points: 2450,
          total_rides: 127,
          total_ship_rides: 8,
          account_settings: {
            language: 'ja',
            currency: 'jpy',
            timezone: 'Asia/Tokyo',
          },
          notification_preferences: {
            push_notifications: true,
            email_notifications: false,
            sms_notifications: true,
            promotional_offers: true,
            ride_updates: true,
            payment_notifications: true,
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
          is_verified: true,
        } as UserProfile);
      }
    } catch (error) {
      console.error('Profile loading error:', error);
      Alert.alert('エラー', 'プロフィール情報の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 画面にフォーカスした時にプロフィールを再読み込み
    const unsubscribe = navigation.addListener('focus', loadProfile);
    return unsubscribe;
  }, [navigation, loadProfile]);

  const handleEditProfile = () => {
    navigation.navigate('ProfileEdit');
  };

  const handlePaymentMethods = () => {
    Alert.alert('支払い方法', '支払い方法管理機能は開発中です');
  };

  const handleRideHistory = () => {
    navigation.navigate('BookingHistory');
  };

  const handleSupport = () => {
    Alert.alert('サポート', 'カスタマーサポート機能は開発中です');
  };

  const handleLogout = () => {
    Alert.alert(
      'ログアウト',
      'ログアウトしますか？',
      [
        {text: 'キャンセル', style: 'cancel'},
        {text: 'ログアウト', style: 'destructive', onPress: () => {
          navigation.reset({
            index: 0,
            routes: [{name: 'Splash'}],
          });
        }},
      ]
    );
  };

  // 通知設定切り替え
  const toggleNotification = async (key: keyof UserProfile['notification_preferences']) => {
    if (!userProfile) return;

    try {
      const updatedPreferences = {
        ...userProfile.notification_preferences,
        [key]: !userProfile.notification_preferences[key],
      };

      const response = await userService.updateNotificationPreferences(updatedPreferences);
      
      if (response.success && response.data) {
        setUserProfile(response.data);
      } else {
        // ローカルで更新（フォールバック）
        setUserProfile(prev => prev ? {
          ...prev,
          notification_preferences: updatedPreferences,
        } : null);
      }
    } catch (error) {
      console.error('Notification update error:', error);
      Alert.alert('エラー', '通知設定の更新に失敗しました');
    }
  };

  const getMembershipLevelText = (level: string) => {
    switch (level) {
      case 'bronze': return 'ブロンズ';
      case 'silver': return 'シルバー';
      case 'gold': return 'ゴールド';
      case 'platinum': return 'プラチナ';
      default: return 'スタンダード';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <GoHeader
          title="プロフィール"
          showBack={true}
          onBack={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={GoTheme.colors.primary} />
          <Text style={styles.loadingText}>プロフィールを読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <GoHeader
          title="プロフィール"
          showBack={true}
          onBack={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>プロフィール情報を取得できませんでした</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <GoHeader
        title="プロフィール"
        showBack={true}
        onBack={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.scrollView}>
        {/* ユーザー情報カード */}
        <GoCard style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {userProfile.profile_image ? (
                <Image source={{uri: userProfile.profile_image}} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>
                  {userProfile.first_name.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>
                {userProfile.last_name} {userProfile.first_name}
              </Text>
              <Text style={styles.membershipLevel}>
                {getMembershipLevelText(userProfile.membership_level)}メンバー
              </Text>
              <View style={styles.pointsContainer}>
                <Text style={styles.pointsText}>
                  ポイント: {userProfile.total_points.toLocaleString()}pt
                </Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Text style={styles.editButtonText}>プロフィール編集</Text>
          </TouchableOpacity>
        </GoCard>

        {/* 利用統計 */}
        <GoCard style={styles.statsCard}>
          <Text style={styles.sectionTitle}>利用統計</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userProfile.total_rides}</Text>
              <Text style={styles.statLabel}>タクシー利用回数</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userProfile.total_ship_rides}</Text>
              <Text style={styles.statLabel}>船舶利用回数</Text>
            </View>
          </View>
        </GoCard>

        {/* メニューオプション */}
        <GoCard style={styles.menuCard}>
          <Text style={styles.sectionTitle}>アカウント</Text>
          
          <MenuOption
            icon="💳"
            title="支払い方法"
            subtitle="クレジットカード・電子マネー管理"
            onPress={handlePaymentMethods}
          />
          
          <MenuOption
            icon="📋"
            title="利用履歴"
            subtitle="過去の予約・決済履歴"
            onPress={handleRideHistory}
          />
          
          <MenuOption
            icon="📍"
            title="お気に入りの場所"
            subtitle="よく使う場所の管理"
            onPress={() => navigation.navigate('FavoriteLocations')}
          />
          
          <MenuOption
            icon="📱"
            title="QR予約履歴"
            subtitle="QRコードでの予約履歴"
            onPress={() => navigation.navigate('QRHistory')}
          />
        </GoCard>

        {/* 通知設定 */}
        <GoCard style={styles.menuCard}>
          <Text style={styles.sectionTitle}>通知設定</Text>
          
          <NotificationOption
            title="プッシュ通知"
            subtitle="アプリ内通知を受け取る"
            value={userProfile.notification_preferences.push_notifications}
            onToggle={() => toggleNotification('push_notifications')}
          />
          
          <NotificationOption
            title="メール通知"
            subtitle="重要な情報をメールで受け取る"
            value={userProfile.notification_preferences.email_notifications}
            onToggle={() => toggleNotification('email_notifications')}
          />
          
          <NotificationOption
            title="SMS通知"
            subtitle="配車状況をSMSで受け取る"
            value={userProfile.notification_preferences.sms_notifications}
            onToggle={() => toggleNotification('sms_notifications')}
          />
          
          <NotificationOption
            title="特典・キャンペーン"
            subtitle="お得な情報を受け取る"
            value={userProfile.notification_preferences.promotional_offers}
            onToggle={() => toggleNotification('promotional_offers')}
          />
        </GoCard>

        {/* サポート */}
        <GoCard style={styles.menuCard}>
          <Text style={styles.sectionTitle}>サポート</Text>
          
          <MenuOption
            icon="🆘"
            title="ヘルプ・サポート"
            subtitle="よくある質問・お問い合わせ"
            onPress={handleSupport}
          />
          
          <MenuOption
            icon="⚙️"
            title="設定"
            subtitle="アカウント設定・通知・プライバシー"
            onPress={() => navigation.navigate('Settings')}
          />
          
          <MenuOption
            icon="ℹ️"
            title="アプリについて"
            subtitle="バージョン情報・利用規約"
            onPress={() => Alert.alert('BiidTaxi', 'Version 1.0.0')}
          />
        </GoCard>

        {/* ログアウトボタン */}
        <View style={styles.logoutContainer}>
          <GoButton
            variant="secondary"
            size="large"
            onPress={handleLogout}
            fullWidth>
            ログアウト
          </GoButton>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

interface MenuOptionProps {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}

const MenuOption: React.FC<MenuOptionProps> = ({
  icon,
  title,
  subtitle,
  onPress,
}) => (
  <TouchableOpacity style={styles.menuOption} onPress={onPress}>
    <View style={styles.menuOptionContent}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <View style={styles.menuOptionText}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
    </View>
    <Text style={styles.chevron}>›</Text>
  </TouchableOpacity>
);

interface NotificationOptionProps {
  title: string;
  subtitle: string;
  value: boolean;
  onToggle: () => void;
}

const NotificationOption: React.FC<NotificationOptionProps> = ({
  title,
  subtitle,
  value,
  onToggle,
}) => (
  <View style={styles.notificationOption}>
    <View style={styles.notificationText}>
      <Text style={styles.notificationTitle}>{title}</Text>
      <Text style={styles.notificationSubtitle}>{subtitle}</Text>
    </View>
    <TouchableOpacity
      style={[styles.toggle, value && styles.toggleActive]}
      onPress={onToggle}>
      <View style={[styles.toggleThumb, value && styles.toggleThumbActive]} />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GoTheme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  profileCard: {
    marginHorizontal: GoTheme.spacing.md,
    marginTop: GoTheme.spacing.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: GoTheme.spacing.md,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: GoTheme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: GoTheme.spacing.md,
  },
  avatarText: {
    fontSize: 32,
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.textSecondary,
    marginTop: GoTheme.spacing.sm,
  },
  errorText: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.error,
    textAlign: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    ...GoTheme.typography.h3,
    color: GoTheme.colors.text,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  membershipLevel: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.primary,
    fontWeight: '600',
    marginBottom: 8,
  },
  pointsContainer: {
    backgroundColor: GoTheme.colors.accent + '20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  pointsText: {
    ...GoTheme.typography.bodySmall,
    color: GoTheme.colors.accent,
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: GoTheme.colors.surface,
    borderWidth: 1,
    borderColor: GoTheme.colors.border,
    borderRadius: GoTheme.borderRadius.md,
    paddingVertical: GoTheme.spacing.sm,
    alignItems: 'center',
  },
  editButtonText: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.primary,
    fontWeight: '600',
  },
  statsCard: {
    marginHorizontal: GoTheme.spacing.md,
    marginTop: GoTheme.spacing.md,
  },
  sectionTitle: {
    ...GoTheme.typography.h4,
    color: GoTheme.colors.text,
    marginBottom: GoTheme.spacing.md,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    ...GoTheme.typography.h2,
    color: GoTheme.colors.primary,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    ...GoTheme.typography.bodySmall,
    color: GoTheme.colors.textSecondary,
    textAlign: 'center',
  },
  menuCard: {
    marginHorizontal: GoTheme.spacing.md,
    marginTop: GoTheme.spacing.md,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: GoTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: GoTheme.colors.divider,
  },
  menuOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: GoTheme.spacing.md,
  },
  menuOptionText: {
    flex: 1,
  },
  menuTitle: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  menuSubtitle: {
    ...GoTheme.typography.bodySmall,
    color: GoTheme.colors.textSecondary,
  },
  chevron: {
    ...GoTheme.typography.h4,
    color: GoTheme.colors.textSecondary,
  },
  notificationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: GoTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: GoTheme.colors.divider,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  notificationSubtitle: {
    ...GoTheme.typography.bodySmall,
    color: GoTheme.colors.textSecondary,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: GoTheme.colors.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: GoTheme.colors.primary,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: GoTheme.colors.surface,
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  logoutContainer: {
    paddingHorizontal: GoTheme.spacing.md,
    paddingVertical: GoTheme.spacing.xl,
  },
});