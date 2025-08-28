import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {GoButton, GoCard, GoHeader} from '../components/GoStyle';
import {GoTheme} from '../theme/GoTheme';
import {userService, UserProfile, UpdateProfileRequest} from '../services/api/userService';

export interface ProfileEditScreenProps {
  navigation: any;
}

interface FormData {
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other' | '';
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
}

interface FormErrors {
  [key: string]: string;
}

export const ProfileEditScreen: React.FC<ProfileEditScreenProps> = ({navigation}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Japan',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // プロフィール取得
  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const response = await userService.getProfile();
      
      if (response.success && response.data) {
        const profileData = response.data;
        setProfile(profileData);
        
        // フォームデータに設定
        setFormData({
          firstName: profileData.first_name || '',
          lastName: profileData.last_name || '',
          phone: profileData.phone || '',
          dateOfBirth: profileData.date_of_birth || '',
          gender: profileData.gender || '',
          street: profileData.address?.street || '',
          city: profileData.address?.city || '',
          state: profileData.address?.state || '',
          postalCode: profileData.address?.postal_code || '',
          country: profileData.address?.country || 'Japan',
          emergencyContactName: profileData.emergency_contact?.name || '',
          emergencyContactPhone: profileData.emergency_contact?.phone || '',
          emergencyContactRelationship: profileData.emergency_contact?.relationship || '',
        });
      } else {
        Alert.alert('エラー', 'プロフィール情報の取得に失敗しました');
      }
    } catch (error) {
      console.error('Profile loading error:', error);
      Alert.alert('エラー', 'プロフィール情報の読み込み中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // フォーム値更新
  const updateFormData = (key: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: value,
    }));
    
    // エラーをクリア
    if (errors[key]) {
      setErrors(prev => ({
        ...prev,
        [key]: '',
      }));
    }
  };

  // バリデーション
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = '名前を入力してください';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = '苗字を入力してください';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = '電話番号を入力してください';
    } else if (!/^[0-9-+\s()]+$/.test(formData.phone)) {
      newErrors.phone = '有効な電話番号を入力してください';
    }

    if (formData.dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(formData.dateOfBirth)) {
      newErrors.dateOfBirth = '生年月日は YYYY-MM-DD 形式で入力してください';
    }

    if (formData.emergencyContactPhone && !/^[0-9-+\s()]+$/.test(formData.emergencyContactPhone)) {
      newErrors.emergencyContactPhone = '有効な電話番号を入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // プロフィール保存
  const handleSaveProfile = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const updateData: UpdateProfileRequest = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        phone: formData.phone.trim(),
        date_of_birth: formData.dateOfBirth || undefined,
        gender: formData.gender || undefined,
        address: {
          street: formData.street.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          postal_code: formData.postalCode.trim(),
          country: formData.country.trim(),
        },
        emergency_contact: formData.emergencyContactName.trim() ? {
          name: formData.emergencyContactName.trim(),
          phone: formData.emergencyContactPhone.trim(),
          relationship: formData.emergencyContactRelationship.trim(),
        } : undefined,
      };

      const response = await userService.updateProfile(updateData);
      
      if (response.success) {
        Alert.alert('成功', 'プロフィールを更新しました', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('エラー', response.error || 'プロフィールの更新に失敗しました');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('エラー', 'プロフィールの更新中にエラーが発生しました');
    } finally {
      setSaving(false);
    }
  };

  // プロフィール画像選択
  const handleSelectImage = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 800,
        maxHeight: 800,
      },
      (response) => {
        if (response.assets && response.assets[0]) {
          handleUploadImage(response.assets[0].uri!);
        }
      }
    );
  };

  // プロフィール画像アップロード
  const handleUploadImage = async (imageUri: string) => {
    setUploadingImage(true);
    try {
      const response = await userService.uploadProfileImage(imageUri);
      
      if (response.success) {
        // プロフィールを再読み込み
        await loadProfile();
        Alert.alert('成功', 'プロフィール画像を更新しました');
      } else {
        Alert.alert('エラー', response.error || '画像のアップロードに失敗しました');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      Alert.alert('エラー', '画像のアップロード中にエラーが発生しました');
    } finally {
      setUploadingImage(false);
    }
  };

  // プロフィール画像削除
  const handleDeleteImage = () => {
    Alert.alert(
      '画像削除',
      'プロフィール画像を削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await userService.deleteProfileImage();
              if (response.success) {
                await loadProfile();
                Alert.alert('成功', 'プロフィール画像を削除しました');
              } else {
                Alert.alert('エラー', response.error || '画像の削除に失敗しました');
              }
            } catch (error) {
              Alert.alert('エラー', '画像の削除中にエラーが発生しました');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <GoHeader
          title="プロフィール編集"
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

  return (
    <SafeAreaView style={styles.container}>
      <GoHeader
        title="プロフィール編集"
        showBack={true}
        onBack={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* プロフィール画像 */}
        <GoCard style={styles.imageCard}>
          <Text style={styles.sectionTitle}>プロフィール画像</Text>
          <View style={styles.imageContainer}>
            <View style={styles.imageWrapper}>
              {profile?.profile_image ? (
                <Image source={{uri: profile.profile_image}} style={styles.profileImage} />
              ) : (
                <View style={styles.placeholderImage}>
                  <Text style={styles.placeholderText}>📸</Text>
                </View>
              )}
              
              {uploadingImage && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="small" color={GoTheme.colors.primary} />
                </View>
              )}
            </View>
            
            <View style={styles.imageButtons}>
              <TouchableOpacity style={styles.imageButton} onPress={handleSelectImage}>
                <Text style={styles.imageButtonText}>写真を選択</Text>
              </TouchableOpacity>
              
              {profile?.profile_image && (
                <TouchableOpacity style={styles.deleteImageButton} onPress={handleDeleteImage}>
                  <Text style={styles.deleteImageButtonText}>削除</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </GoCard>

        {/* 基本情報 */}
        <GoCard style={styles.formCard}>
          <Text style={styles.sectionTitle}>基本情報</Text>
          
          <FormField
            label="苗字"
            value={formData.lastName}
            onChangeText={(value) => updateFormData('lastName', value)}
            error={errors.lastName}
            placeholder="田中"
            required
          />
          
          <FormField
            label="名前"
            value={formData.firstName}
            onChangeText={(value) => updateFormData('firstName', value)}
            error={errors.firstName}
            placeholder="太郎"
            required
          />
          
          <FormField
            label="電話番号"
            value={formData.phone}
            onChangeText={(value) => updateFormData('phone', value)}
            error={errors.phone}
            placeholder="090-1234-5678"
            keyboardType="phone-pad"
            required
          />
          
          <FormField
            label="生年月日"
            value={formData.dateOfBirth}
            onChangeText={(value) => updateFormData('dateOfBirth', value)}
            error={errors.dateOfBirth}
            placeholder="1990-01-01"
          />

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>性別</Text>
            <View style={styles.genderContainer}>
              {[
                { value: 'male', label: '男性' },
                { value: 'female', label: '女性' },
                { value: 'other', label: 'その他' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.genderOption,
                    formData.gender === option.value && styles.genderOptionSelected,
                  ]}
                  onPress={() => updateFormData('gender', option.value)}>
                  <Text
                    style={[
                      styles.genderOptionText,
                      formData.gender === option.value && styles.genderOptionTextSelected,
                    ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </GoCard>

        {/* 住所情報 */}
        <GoCard style={styles.formCard}>
          <Text style={styles.sectionTitle}>住所情報</Text>
          
          <FormField
            label="国"
            value={formData.country}
            onChangeText={(value) => updateFormData('country', value)}
            placeholder="Japan"
          />
          
          <FormField
            label="都道府県"
            value={formData.state}
            onChangeText={(value) => updateFormData('state', value)}
            placeholder="東京都"
          />
          
          <FormField
            label="市区町村"
            value={formData.city}
            onChangeText={(value) => updateFormData('city', value)}
            placeholder="港区"
          />
          
          <FormField
            label="住所"
            value={formData.street}
            onChangeText={(value) => updateFormData('street', value)}
            placeholder="青山1-1-1"
          />
          
          <FormField
            label="郵便番号"
            value={formData.postalCode}
            onChangeText={(value) => updateFormData('postalCode', value)}
            placeholder="107-0061"
            keyboardType="numeric"
          />
        </GoCard>

        {/* 緊急連絡先 */}
        <GoCard style={styles.formCard}>
          <Text style={styles.sectionTitle}>緊急連絡先</Text>
          
          <FormField
            label="連絡先名"
            value={formData.emergencyContactName}
            onChangeText={(value) => updateFormData('emergencyContactName', value)}
            placeholder="田中花子"
          />
          
          <FormField
            label="電話番号"
            value={formData.emergencyContactPhone}
            onChangeText={(value) => updateFormData('emergencyContactPhone', value)}
            error={errors.emergencyContactPhone}
            placeholder="090-9876-5432"
            keyboardType="phone-pad"
          />
          
          <FormField
            label="続柄"
            value={formData.emergencyContactRelationship}
            onChangeText={(value) => updateFormData('emergencyContactRelationship', value)}
            placeholder="配偶者"
          />
        </GoCard>

        {/* 保存ボタン */}
        <View style={styles.buttonContainer}>
          <GoButton
            variant="primary"
            size="large"
            onPress={handleSaveProfile}
            disabled={saving}
            fullWidth>
            {saving ? '保存中...' : 'プロフィールを保存'}
          </GoButton>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'phone-pad' | 'email-address';
  required?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChangeText,
  error,
  placeholder,
  keyboardType = 'default',
  required = false,
}) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.fieldLabel}>
      {label}
      {required && <Text style={styles.requiredMark}> *</Text>}
    </Text>
    <TextInput
      style={[styles.textInput, error && styles.textInputError]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={GoTheme.colors.textSecondary}
      keyboardType={keyboardType}
      autoCapitalize="none"
    />
    {error && <Text style={styles.errorText}>{error}</Text>}
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
  imageCard: {
    marginHorizontal: GoTheme.spacing.md,
    marginTop: GoTheme.spacing.md,
  },
  formCard: {
    marginHorizontal: GoTheme.spacing.md,
    marginTop: GoTheme.spacing.md,
  },
  sectionTitle: {
    ...GoTheme.typography.h4,
    color: GoTheme.colors.text,
    marginBottom: GoTheme.spacing.md,
    fontWeight: 'bold',
  },
  imageContainer: {
    alignItems: 'center',
  },
  imageWrapper: {
    position: 'relative',
    marginBottom: GoTheme.spacing.md,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: GoTheme.colors.surface,
    borderWidth: 2,
    borderColor: GoTheme.colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 48,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageButtons: {
    flexDirection: 'row',
    gap: GoTheme.spacing.sm,
  },
  imageButton: {
    paddingHorizontal: GoTheme.spacing.md,
    paddingVertical: GoTheme.spacing.sm,
    backgroundColor: GoTheme.colors.primary,
    borderRadius: GoTheme.borderRadius.sm,
  },
  imageButtonText: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.textOnPrimary,
    fontWeight: '600',
  },
  deleteImageButton: {
    paddingHorizontal: GoTheme.spacing.md,
    paddingVertical: GoTheme.spacing.sm,
    backgroundColor: GoTheme.colors.surface,
    borderWidth: 1,
    borderColor: GoTheme.colors.error,
    borderRadius: GoTheme.borderRadius.sm,
  },
  deleteImageButtonText: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.error,
    fontWeight: '600',
  },
  fieldContainer: {
    marginBottom: GoTheme.spacing.md,
  },
  fieldLabel: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.text,
    marginBottom: GoTheme.spacing.xs,
    fontWeight: '600',
  },
  requiredMark: {
    color: GoTheme.colors.error,
  },
  textInput: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.text,
    backgroundColor: GoTheme.colors.surface,
    borderWidth: 1,
    borderColor: GoTheme.colors.border,
    borderRadius: GoTheme.borderRadius.sm,
    paddingHorizontal: GoTheme.spacing.md,
    paddingVertical: GoTheme.spacing.sm,
    height: 48,
  },
  textInputError: {
    borderColor: GoTheme.colors.error,
  },
  errorText: {
    ...GoTheme.typography.bodySmall,
    color: GoTheme.colors.error,
    marginTop: GoTheme.spacing.xs,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: GoTheme.spacing.sm,
  },
  genderOption: {
    flex: 1,
    paddingVertical: GoTheme.spacing.sm,
    borderWidth: 1,
    borderColor: GoTheme.colors.border,
    borderRadius: GoTheme.borderRadius.sm,
    alignItems: 'center',
  },
  genderOptionSelected: {
    backgroundColor: GoTheme.colors.primary,
    borderColor: GoTheme.colors.primary,
  },
  genderOptionText: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.text,
  },
  genderOptionTextSelected: {
    color: GoTheme.colors.textOnPrimary,
    fontWeight: '600',
  },
  buttonContainer: {
    paddingHorizontal: GoTheme.spacing.md,
    paddingVertical: GoTheme.spacing.xl,
  },
});