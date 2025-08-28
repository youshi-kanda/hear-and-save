import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { GoCard } from '../GoStyle/GoCard';
import { GoButton } from '../GoStyle/GoButton';
import { useTheme } from '../../contexts/ThemeContext';
import { logger } from '../../config/environment';

interface ProfileTabProps {
  currentMode: 'taxi' | 'ship';
}

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  memberSince: string;
  totalTrips: number;
  totalSpent: number;
  averageRating: number;
  favoriteLocations: number;
}

interface SettingsItem {
  id: string;
  title: string;
  subtitle?: string;
  type: 'navigation' | 'switch' | 'info';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ currentMode }) => {
  const navigation = useNavigation();
  const { colors, mode, toggleTheme } = useTheme();
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    setIsLoading(true);
    try {
      logger.log('Loading user profile...');
      
      // モックプロフィールデータ
      const mockProfile: UserProfile = {
        name: '山田 太郎',
        email: 'yamada@example.com',
        phone: '+81 90-1234-5678',
        memberSince: '2023年8月',
        totalTrips: 47,
        totalSpent: 125000,
        averageRating: 4.8,
        favoriteLocations: 5,
      };
      
      await new Promise(resolve => setTimeout(resolve, 500));
      setUserProfile(mockProfile);
      
    } catch (error) {
      logger.error('Failed to load user profile:', error);
      Alert.alert('エラー', 'プロフィール情報の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const settingsItems: SettingsItem[] = [
    {
      id: 'profile',
      title: 'プロフィール編集',
      subtitle: '名前、メールアドレス、電話番号',
      type: 'navigation',
      onPress: () => navigation.navigate('ProfileEdit'),
    },
    {
      id: 'favorites',
      title: 'よく使う場所',
      subtitle: `${userProfile?.favoriteLocations || 0}件の登録済み場所`,
      type: 'navigation',
      onPress: () => navigation.navigate('FavoriteLocations'),
    },
    {
      id: 'history',
      title: '利用履歴',
      subtitle: `合計${userProfile?.totalTrips || 0}回の利用`,
      type: 'navigation',
      onPress: () => {}, // Already on history tab
    },
    {
      id: 'notifications',
      title: 'プッシュ通知',
      subtitle: '予約状況やお得な情報をお知らせ',
      type: 'switch',
      value: notificationsEnabled,
      onToggle: setNotificationsEnabled,
    },
    {
      id: 'location',
      title: '位置情報サービス',
      subtitle: '現在地の取得を許可',
      type: 'switch',
      value: locationEnabled,
      onToggle: setLocationEnabled,
    },
    {
      id: 'darkmode',
      title: 'ダークモード',
      subtitle: '暗いテーマを使用',
      type: 'switch',
      value: mode === 'dark',
      onToggle: () => toggleTheme(),
    },
    {
      id: 'settings',
      title: '設定',
      subtitle: 'アプリケーション設定',
      type: 'navigation',
      onPress: () => navigation.navigate('Settings'),
    },
  ];

  const handleLogout = () => {
    Alert.alert(
      'ログアウト',
      'ログアウトしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: 'ログアウト', 
          style: 'destructive',
          onPress: () => {
            // TODO: 実際のログアウト処理
            navigation.navigate('PhoneAuth');
          }
        },
      ]
    );
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Text key={i} style={styles.star}>⭐</Text>);
    }
    
    if (hasHalfStar) {
      stars.push(<Text key="half" style={styles.star}>⭐</Text>);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Text key={`empty-${i}`} style={styles.star}>☆</Text>);
    }
    
    return stars;
  };

  const renderSettingsItem = (item: SettingsItem) => {
    switch (item.type) {
      case 'navigation':
        return (
          <TouchableOpacity
            key={item.id}
            style={styles.settingsItem}
            onPress={item.onPress}
          >
            <View style={styles.settingsItemContent}>
              <Text style={styles.settingsTitle}>{item.title}</Text>
              {item.subtitle && (
                <Text style={styles.settingsSubtitle}>{item.subtitle}</Text>
              )}
            </View>
            <Text style={styles.settingsArrow}>›</Text>
          </TouchableOpacity>
        );
      
      case 'switch':
        return (
          <View key={item.id} style={styles.settingsItem}>
            <View style={styles.settingsItemContent}>
              <Text style={styles.settingsTitle}>{item.title}</Text>
              {item.subtitle && (
                <Text style={styles.settingsSubtitle}>{item.subtitle}</Text>
              )}
            </View>
            <Switch
              value={item.value || false}
              onValueChange={item.onToggle}
              trackColor={{ false: '#d1d5db', true: colors.primary }}
              thumbColor={item.value ? '#ffffff' : '#f3f4f6'}
            />
          </View>
        );
      
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>プロフィールを読み込み中...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* プロフィールヘッダー */}
      {userProfile && (
        <GoCard style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {userProfile.name.charAt(0)}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{userProfile.name}</Text>
              <Text style={styles.userEmail}>{userProfile.email}</Text>
              <Text style={styles.memberSince}>
                {userProfile.memberSince}からのメンバー
              </Text>
            </View>
          </View>

          {/* 統計情報 */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userProfile.totalTrips}</Text>
              <Text style={styles.statLabel}>利用回数</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                ¥{userProfile.totalSpent.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>累計金額</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={styles.ratingContainer}>
                {renderStars(userProfile.averageRating)}
              </View>
              <Text style={styles.statLabel}>平均評価</Text>
            </View>
          </View>
        </GoCard>
      )}

      {/* 設定項目 */}
      <GoCard style={styles.settingsCard}>
        <Text style={styles.sectionTitle}>設定</Text>
        {settingsItems.map(renderSettingsItem)}
      </GoCard>

      {/* その他のオプション */}
      <GoCard style={styles.actionsCard}>
        <TouchableOpacity style={styles.actionItem}>
          <Text style={styles.actionText}>ヘルプ・サポート</Text>
          <Text style={styles.settingsArrow}>›</Text>
        </TouchableOpacity>
        
        <View style={styles.actionDivider} />
        
        <TouchableOpacity style={styles.actionItem}>
          <Text style={styles.actionText}>利用規約</Text>
          <Text style={styles.settingsArrow}>›</Text>
        </TouchableOpacity>
        
        <View style={styles.actionDivider} />
        
        <TouchableOpacity style={styles.actionItem}>
          <Text style={styles.actionText}>プライバシーポリシー</Text>
          <Text style={styles.settingsArrow}>›</Text>
        </TouchableOpacity>
        
        <View style={styles.actionDivider} />
        
        <TouchableOpacity style={styles.actionItem}>
          <Text style={styles.actionText}>アプリについて</Text>
          <Text style={styles.settingsArrow}>›</Text>
        </TouchableOpacity>
      </GoCard>

      {/* ログアウトボタン */}
      <View style={styles.logoutContainer}>
        <GoButton
          title="ログアウト"
          onPress={handleLogout}
          style={styles.logoutButton}
          textStyle={styles.logoutButtonText}
        />
      </View>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },

  // プロフィールカード
  profileCard: {
    margin: 16,
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1e40af',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 12,
    color: '#9ca3af',
  },

  // 統計情報
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 4,
  },
  star: {
    fontSize: 12,
  },

  // 設定カード
  settingsCard: {
    margin: 16,
    marginTop: 0,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 16,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingsItemContent: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 2,
  },
  settingsSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  settingsArrow: {
    fontSize: 20,
    color: '#9ca3af',
    fontWeight: '300',
  },

  // アクションカード
  actionsCard: {
    margin: 16,
    marginTop: 0,
    padding: 0,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  actionText: {
    fontSize: 16,
    color: '#374151',
  },
  actionDivider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginLeft: 20,
  },

  // ログアウト
  logoutContainer: {
    margin: 16,
    marginTop: 0,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    borderRadius: 25,
    paddingVertical: 16,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  bottomSpacing: {
    height: 32,
  },
});

export default ProfileTab;