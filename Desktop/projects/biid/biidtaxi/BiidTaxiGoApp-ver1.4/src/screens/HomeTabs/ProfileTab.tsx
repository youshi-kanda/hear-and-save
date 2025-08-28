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
import { GoCard } from '../../components/GoStyle/GoCard';
import { GoButton } from '../../components/GoStyle/GoButton';
import { User } from '../../services/api/types';
import { authService } from '../../services/api/authService';
import { useNavigation } from '@react-navigation/native';

interface ProfileTabProps {
  currentMode: 'taxi' | 'ship';
  navigation?: any;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ currentMode }) => {
  const navigation = useNavigation();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      
      // モックユーザーデータ - 実際のAPI実装時に置き換え
      const mockUser: User = {
        id: 'user_123',
        name: '田中 太郎',
        email: 'tanaka@example.com',
        phone: '090-1234-5678',
        membershipLevel: 'ゴールド',
        points: 2450,
        totalRides: 42,
        totalShipRides: 8,
        createdAt: '2023-06-15T10:30:00Z'
      };

      setUser(mockUser);
    } catch (error) {
      console.error('Failed to load user profile:', error);
      Alert.alert('エラー', 'プロフィールの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProfile = () => {
    Alert.alert('プロフィール編集', 'プロフィール編集画面に移動します');
  };

  const handlePaymentMethods = () => {
    Alert.alert('支払い方法', '支払い方法設定画面に移動します');
  };

  const handleSupport = () => {
    Alert.alert('サポート', 'サポートセンターに連絡します');
  };

  const handleLogout = () => {
    Alert.alert(
      'ログアウト',
      'ログアウトしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'ログアウト',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.logout();
              // ログイン画面に遷移
              navigation.reset({
                index: 0,
                routes: [{ name: 'LocationPermission' as never }],
              });
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('エラー', 'ログアウトに失敗しました');
            }
          }
        }
      ]
    );
  };

  const getMembershipColor = (level: string): string => {
    switch (level) {
      case 'プラチナ': return '#8b5cf6';
      case 'ゴールド': return '#f59e0b';
      case 'ベーシック': return '#6b7280';
      default: return '#6b7280';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <GoCard style={styles.errorCard}>
          <Text style={styles.errorText}>プロフィール情報を読み込めませんでした</Text>
          <GoButton
            title="再読み込み"
            onPress={loadUserProfile}
            style={styles.retryButton}
          />
        </GoCard>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* プロフィール情報 */}
      <GoCard style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <View style={[styles.membershipBadge, { backgroundColor: getMembershipColor(user.membershipLevel) }]}>
              <Text style={styles.membershipText}>{user.membershipLevel}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Text style={styles.editButtonText}>編集</Text>
          </TouchableOpacity>
        </View>
      </GoCard>

      {/* 統計情報 */}
      <GoCard style={styles.statsCard}>
        <Text style={styles.sectionTitle}>利用統計</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.totalRides}</Text>
            <Text style={styles.statLabel}>タクシー利用回数</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.totalShipRides}</Text>
            <Text style={styles.statLabel}>船舶利用回数</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.points}</Text>
            <Text style={styles.statLabel}>ポイント</Text>
          </View>
        </View>
      </GoCard>

      {/* 設定 */}
      <GoCard style={styles.settingsCard}>
        <Text style={styles.sectionTitle}>設定</Text>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>プッシュ通知</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>位置情報</Text>
          <Switch
            value={locationEnabled}
            onValueChange={setLocationEnabled}
            trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
          />
        </View>

        <TouchableOpacity style={styles.settingItem} onPress={handlePaymentMethods}>
          <Text style={styles.settingLabel}>支払い方法</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
      </GoCard>

      {/* アプリ情報・サポート */}
      <GoCard style={styles.supportCard}>
        <Text style={styles.sectionTitle}>アプリ・サポート</Text>
        
        <TouchableOpacity style={styles.supportItem} onPress={handleSupport}>
          <Text style={styles.supportLabel}>ヘルプ・サポート</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.supportItem}>
          <Text style={styles.supportLabel}>利用規約</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.supportItem}>
          <Text style={styles.supportLabel}>プライバシーポリシー</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>

        <View style={styles.supportItem}>
          <Text style={styles.supportLabel}>アプリバージョン</Text>
          <Text style={styles.versionText}>1.0.0</Text>
        </View>
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
    backgroundColor: '#f8fafc',
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
  errorCard: {
    margin: 20,
    padding: 30,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
  },
  profileCard: {
    margin: 20,
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3b82f6',
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
    color: '#1f2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  membershipBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  membershipText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  editButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  statsCard: {
    margin: 20,
    marginTop: 0,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  settingsCard: {
    margin: 20,
    marginTop: 0,
    padding: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingLabel: {
    fontSize: 16,
    color: '#1f2937',
  },
  settingArrow: {
    fontSize: 20,
    color: '#9ca3af',
  },
  supportCard: {
    margin: 20,
    marginTop: 0,
    padding: 20,
  },
  supportItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  supportLabel: {
    fontSize: 16,
    color: '#1f2937',
  },
  versionText: {
    fontSize: 14,
    color: '#6b7280',
  },
  logoutContainer: {
    margin: 20,
    marginTop: 0,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
  },
  logoutButtonText: {
    color: '#ffffff',
  },
  bottomSpacing: {
    height: 20,
  },
});