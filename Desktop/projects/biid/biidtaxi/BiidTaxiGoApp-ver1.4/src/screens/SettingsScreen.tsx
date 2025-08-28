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
  Switch,
  Linking,
} from 'react-native';
import {GoButton, GoCard, GoHeader} from '../components/GoStyle';
import {GoTheme} from '../theme/GoTheme';
import {userService, UserProfile} from '../services/api/userService';
import {notificationService} from '../services/notification/notificationService';

export interface SettingsScreenProps {
  navigation: any;
}

interface SettingsData {
  language: 'ja' | 'en';
  currency: 'jpy' | 'usd';
  notifications: {
    pushNotifications: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
    promotionalOffers: boolean;
    rideUpdates: boolean;
    paymentNotifications: boolean;
  };
  privacy: {
    dataSharing: boolean;
    locationHistory: boolean;
    marketingEmails: boolean;
    analyticsTracking: boolean;
  };
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({navigation}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState<SettingsData>({
    language: 'ja',
    currency: 'jpy',
    notifications: {
      pushNotifications: true,
      emailNotifications: false,
      smsNotifications: true,
      promotionalOffers: true,
      rideUpdates: true,
      paymentNotifications: true,
    },
    privacy: {
      dataSharing: false,
      locationHistory: true,
      marketingEmails: false,
      analyticsTracking: true,
    },
  });

  // 設定読み込み
  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await userService.getProfile();
      
      if (response.success && response.data) {
        const profileData = response.data;
        setProfile(profileData);
        
        setSettings({
          language: profileData.account_settings.language,
          currency: profileData.account_settings.currency,
          notifications: {
            pushNotifications: profileData.notification_preferences.push_notifications,
            emailNotifications: profileData.notification_preferences.email_notifications,
            smsNotifications: profileData.notification_preferences.sms_notifications,
            promotionalOffers: profileData.notification_preferences.promotional_offers,
            rideUpdates: profileData.notification_preferences.ride_updates,
            paymentNotifications: profileData.notification_preferences.payment_notifications,
          },
          privacy: {
            dataSharing: false, // Default values since this isn't in the API response
            locationHistory: true,
            marketingEmails: false,
            analyticsTracking: true,
          },
        });
      }
    } catch (error) {
      console.error('Settings loading error:', error);
      Alert.alert('エラー', '設定の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // 通知設定更新
  const updateNotificationSetting = async (
    key: keyof SettingsData['notifications'], 
    value: boolean
  ) => {
    try {
      setSaving(true);
      
      const updatedNotifications = {
        ...settings.notifications,
        [key]: value,
      };

      // API更新
      const response = await userService.updateNotificationPreferences({
        push_notifications: updatedNotifications.pushNotifications,
        email_notifications: updatedNotifications.emailNotifications,
        sms_notifications: updatedNotifications.smsNotifications,
        promotional_offers: updatedNotifications.promotionalOffers,
        ride_updates: updatedNotifications.rideUpdates,
        payment_notifications: updatedNotifications.paymentNotifications,
      });

      if (response.success) {
        setSettings(prev => ({
          ...prev,
          notifications: updatedNotifications,
        }));

        // Firebase通知設定も更新
        if (key === 'pushNotifications') {
          if (value) {
            await notificationService.initialize();
          }
        }
      } else {
        Alert.alert('エラー', response.error || '通知設定の更新に失敗しました');
      }
    } catch (error) {
      console.error('Notification setting update error:', error);
      Alert.alert('エラー', '通知設定の更新中にエラーが発生しました');
    } finally {
      setSaving(false);
    }
  };

  // アカウント設定更新
  const updateAccountSetting = async (
    key: keyof Pick<SettingsData, 'language' | 'currency'>, 
    value: string
  ) => {
    try {
      setSaving(true);
      
      const response = await userService.updateAccountSettings({
        [key]: value,
      });

      if (response.success) {
        setSettings(prev => ({
          ...prev,
          [key]: value,
        }));
        Alert.alert('成功', '設定を更新しました');
      } else {
        Alert.alert('エラー', response.error || '設定の更新に失敗しました');
      }
    } catch (error) {
      console.error('Account setting update error:', error);
      Alert.alert('エラー', '設定の更新中にエラーが発生しました');
    } finally {
      setSaving(false);
    }
  };

  // プライバシー設定更新
  const updatePrivacySetting = async (
    key: keyof SettingsData['privacy'], 
    value: boolean
  ) => {
    try {
      setSaving(true);
      
      const updatedPrivacy = {
        ...settings.privacy,
        [key]: value,
      };

      const response = await userService.updatePrivacySettings({
        data_sharing: updatedPrivacy.dataSharing,
        location_history: updatedPrivacy.locationHistory,
        marketing_emails: updatedPrivacy.marketingEmails,
        analytics_tracking: updatedPrivacy.analyticsTracking,
      });

      if (response.success) {
        setSettings(prev => ({
          ...prev,
          privacy: updatedPrivacy,
        }));
      } else {
        Alert.alert('エラー', response.error || 'プライバシー設定の更新に失敗しました');
      }
    } catch (error) {
      console.error('Privacy setting update error:', error);
      Alert.alert('エラー', 'プライバシー設定の更新中にエラーが発生しました');
    } finally {
      setSaving(false);
    }
  };

  // パスワード変更
  const handleChangePassword = () => {
    Alert.prompt(
      'パスワード変更',
      '現在のパスワードを入力してください',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '次へ',
          onPress: (currentPassword?: string) => {
            if (currentPassword) {
              handleNewPasswordInput(currentPassword);
            }
          }
        }
      ],
      'secure-text'
    );
  };

  const handleNewPasswordInput = (currentPassword: string) => {
    Alert.prompt(
      'パスワード変更',
      '新しいパスワードを入力してください',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '確認',
          onPress: (newPassword?: string) => {
            if (newPassword) {
              handleConfirmPassword(currentPassword, newPassword);
            }
          }
        }
      ],
      'secure-text'
    );
  };

  const handleConfirmPassword = (currentPassword: string, newPassword: string) => {
    Alert.prompt(
      'パスワード変更',
      'パスワードを再入力してください',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '変更',
          onPress: async (confirmPassword?: string) => {
            if (confirmPassword === newPassword) {
              try {
                setSaving(true);
                const response = await userService.changePassword({
                  current_password: currentPassword,
                  new_password: newPassword,
                  confirm_password: confirmPassword,
                });

                if (response.success) {
                  Alert.alert('成功', 'パスワードを変更しました');
                } else {
                  Alert.alert('エラー', response.error || 'パスワードの変更に失敗しました');
                }
              } catch (error) {
                Alert.alert('エラー', 'パスワード変更中にエラーが発生しました');
              } finally {
                setSaving(false);
              }
            } else {
              Alert.alert('エラー', 'パスワードが一致しません');
            }
          }
        }
      ],
      'secure-text'
    );
  };

  // データエクスポート
  const handleDataExport = async () => {
    Alert.alert(
      'データエクスポート',
      'あなたのデータをエクスポートしますか？\nエクスポートが完了するとメールでお知らせします。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'エクスポート',
          onPress: async () => {
            try {
              setSaving(true);
              const response = await userService.requestDataExport();
              
              if (response.success) {
                Alert.alert('成功', 'データエクスポートのリクエストを受け付けました。完了次第メールでお知らせします。');
              } else {
                Alert.alert('エラー', response.error || 'データエクスポートに失敗しました');
              }
            } catch (error) {
              Alert.alert('エラー', 'データエクスポート中にエラーが発生しました');
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  // アカウント削除
  const handleDeleteAccount = () => {
    Alert.alert(
      '⚠️ アカウント削除',
      'アカウントを削除すると、すべてのデータが永久に失われます。この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する',
          style: 'destructive',
          onPress: () => {
            Alert.prompt(
              'アカウント削除',
              'パスワードを入力して削除を確認してください',
              [
                { text: 'キャンセル', style: 'cancel' },
                {
                  text: '削除',
                  style: 'destructive',
                  onPress: async (password?: string) => {
                    if (password) {
                      try {
                        setSaving(true);
                        const response = await userService.deleteAccount(password);
                        
                        if (response.success) {
                          Alert.alert('削除完了', 'アカウントを削除しました', [
                            { text: 'OK', onPress: () => {
                              navigation.reset({
                                index: 0,
                                routes: [{ name: 'Splash' }],
                              });
                            }}
                          ]);
                        } else {
                          Alert.alert('エラー', response.error || 'アカウントの削除に失敗しました');
                        }
                      } catch (error) {
                        Alert.alert('エラー', 'アカウント削除中にエラーが発生しました');
                      } finally {
                        setSaving(false);
                      }
                    }
                  }
                }
              ],
              'secure-text'
            );
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <GoHeader
          title="設定"
          showBack={true}
          onBack={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={GoTheme.colors.primary} />
          <Text style={styles.loadingText}>設定を読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <GoHeader
        title="設定"
        showBack={true}
        onBack={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* アカウント設定 */}
        <GoCard style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>アカウント設定</Text>
          
          <SettingRow
            title="言語"
            subtitle={settings.language === 'ja' ? '日本語' : 'English'}
            onPress={() => {
              Alert.alert(
                '言語設定',
                '言語を選択してください',
                [
                  { text: 'キャンセル', style: 'cancel' },
                  { text: '日本語', onPress: () => updateAccountSetting('language', 'ja') },
                  { text: 'English', onPress: () => updateAccountSetting('language', 'en') },
                ]
              );
            }}
          />
          
          <SettingRow
            title="通貨"
            subtitle={settings.currency === 'jpy' ? '日本円（¥）' : 'US Dollar ($)'}
            onPress={() => {
              Alert.alert(
                '通貨設定',
                '表示通貨を選択してください',
                [
                  { text: 'キャンセル', style: 'cancel' },
                  { text: '日本円（¥）', onPress: () => updateAccountSetting('currency', 'jpy') },
                  { text: 'US Dollar ($)', onPress: () => updateAccountSetting('currency', 'usd') },
                ]
              );
            }}
          />
          
          <SettingRow
            title="パスワード変更"
            subtitle="アカウントのパスワードを変更"
            onPress={handleChangePassword}
          />
        </GoCard>

        {/* 通知設定 */}
        <GoCard style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>通知設定</Text>
          
          <SettingToggle
            title="プッシュ通知"
            subtitle="アプリ内通知を受け取る"
            value={settings.notifications.pushNotifications}
            onToggle={(value) => updateNotificationSetting('pushNotifications', value)}
          />
          
          <SettingToggle
            title="メール通知"
            subtitle="重要な情報をメールで受け取る"
            value={settings.notifications.emailNotifications}
            onToggle={(value) => updateNotificationSetting('emailNotifications', value)}
          />
          
          <SettingToggle
            title="SMS通知"
            subtitle="配車状況をSMSで受け取る"
            value={settings.notifications.smsNotifications}
            onToggle={(value) => updateNotificationSetting('smsNotifications', value)}
          />
          
          <SettingToggle
            title="乗車更新通知"
            subtitle="乗車状況の更新を通知"
            value={settings.notifications.rideUpdates}
            onToggle={(value) => updateNotificationSetting('rideUpdates', value)}
          />
          
          <SettingToggle
            title="決済通知"
            subtitle="決済に関する通知を受け取る"
            value={settings.notifications.paymentNotifications}
            onToggle={(value) => updateNotificationSetting('paymentNotifications', value)}
          />
          
          <SettingToggle
            title="特典・キャンペーン"
            subtitle="お得な情報を受け取る"
            value={settings.notifications.promotionalOffers}
            onToggle={(value) => updateNotificationSetting('promotionalOffers', value)}
          />
        </GoCard>

        {/* プライバシー設定 */}
        <GoCard style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>プライバシー設定</Text>
          
          <SettingToggle
            title="位置情報履歴"
            subtitle="位置情報の履歴を保存"
            value={settings.privacy.locationHistory}
            onToggle={(value) => updatePrivacySetting('locationHistory', value)}
          />
          
          <SettingToggle
            title="データ共有"
            subtitle="サービス向上のためデータを共有"
            value={settings.privacy.dataSharing}
            onToggle={(value) => updatePrivacySetting('dataSharing', value)}
          />
          
          <SettingToggle
            title="マーケティングメール"
            subtitle="マーケティング用メールを受け取る"
            value={settings.privacy.marketingEmails}
            onToggle={(value) => updatePrivacySetting('marketingEmails', value)}
          />
          
          <SettingToggle
            title="分析トラッキング"
            subtitle="アプリの使用状況を分析"
            value={settings.privacy.analyticsTracking}
            onToggle={(value) => updatePrivacySetting('analyticsTracking', value)}
          />
        </GoCard>

        {/* データ管理 */}
        <GoCard style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>データ管理</Text>
          
          <SettingRow
            title="データエクスポート"
            subtitle="あなたのデータをダウンロード"
            onPress={handleDataExport}
          />
        </GoCard>

        {/* サポート */}
        <GoCard style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>サポート</Text>
          
          <SettingRow
            title="ヘルプセンター"
            subtitle="よくある質問とサポート"
            onPress={() => Linking.openURL('https://biidtaxi.com/help')}
          />
          
          <SettingRow
            title="利用規約"
            subtitle="サービス利用規約を確認"
            onPress={() => Linking.openURL('https://biidtaxi.com/terms')}
          />
          
          <SettingRow
            title="プライバシーポリシー"
            subtitle="プライバシーポリシーを確認"
            onPress={() => Linking.openURL('https://biidtaxi.com/privacy')}
          />
        </GoCard>

        {/* 危険ゾーン */}
        <GoCard style={styles.dangerCard}>
          <Text style={styles.sectionTitle}>危険ゾーン</Text>
          
          <TouchableOpacity style={styles.dangerButton} onPress={handleDeleteAccount}>
            <Text style={styles.dangerButtonText}>アカウントを削除</Text>
            <Text style={styles.dangerButtonSubtitle}>この操作は取り消せません</Text>
          </TouchableOpacity>
        </GoCard>
      </ScrollView>

      {/* 保存インジケータ */}
      {saving && (
        <View style={styles.savingOverlay}>
          <View style={styles.savingContainer}>
            <ActivityIndicator size="large" color={GoTheme.colors.primary} />
            <Text style={styles.savingText}>保存中...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

interface SettingRowProps {
  title: string;
  subtitle?: string;
  onPress: () => void;
}

const SettingRow: React.FC<SettingRowProps> = ({title, subtitle, onPress}) => (
  <TouchableOpacity style={styles.settingRow} onPress={onPress}>
    <View style={styles.settingContent}>
      <Text style={styles.settingTitle}>{title}</Text>
      {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
    </View>
    <Text style={styles.chevron}>›</Text>
  </TouchableOpacity>
);

interface SettingToggleProps {
  title: string;
  subtitle?: string;
  value: boolean;
  onToggle: (value: boolean) => void;
}

const SettingToggle: React.FC<SettingToggleProps> = ({title, subtitle, value, onToggle}) => (
  <View style={styles.settingRow}>
    <View style={styles.settingContent}>
      <Text style={styles.settingTitle}>{title}</Text>
      {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{
        false: GoTheme.colors.border,
        true: GoTheme.colors.primary,
      }}
      thumbColor={GoTheme.colors.surface}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GoTheme.colors.background,
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
  scrollView: {
    flex: 1,
  },
  settingsCard: {
    marginHorizontal: GoTheme.spacing.md,
    marginTop: GoTheme.spacing.md,
  },
  dangerCard: {
    marginHorizontal: GoTheme.spacing.md,
    marginTop: GoTheme.spacing.md,
    marginBottom: GoTheme.spacing.xl,
    backgroundColor: GoTheme.colors.error + '05',
    borderColor: GoTheme.colors.error + '20',
    borderWidth: 1,
  },
  sectionTitle: {
    ...GoTheme.typography.h4,
    color: GoTheme.colors.text,
    marginBottom: GoTheme.spacing.md,
    fontWeight: 'bold',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: GoTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: GoTheme.colors.divider,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingSubtitle: {
    ...GoTheme.typography.bodySmall,
    color: GoTheme.colors.textSecondary,
  },
  chevron: {
    ...GoTheme.typography.h4,
    color: GoTheme.colors.textSecondary,
  },
  dangerButton: {
    paddingVertical: GoTheme.spacing.md,
    alignItems: 'center',
  },
  dangerButtonText: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.error,
    fontWeight: '600',
  },
  dangerButtonSubtitle: {
    ...GoTheme.typography.bodySmall,
    color: GoTheme.colors.textSecondary,
    marginTop: 2,
  },
  savingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  savingContainer: {
    backgroundColor: GoTheme.colors.surface,
    padding: GoTheme.spacing.xl,
    borderRadius: GoTheme.borderRadius.md,
    alignItems: 'center',
  },
  savingText: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.text,
    marginTop: GoTheme.spacing.sm,
  },
});