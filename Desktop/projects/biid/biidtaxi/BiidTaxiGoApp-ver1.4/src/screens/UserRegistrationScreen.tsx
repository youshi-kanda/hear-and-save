import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { GoButton } from '../components/GoStyle/GoButton';
import { GoGradientBackground } from '../components/GoStyle/GoGradientBackground';
import { logger } from '../config/environment';

interface UserRegistrationScreenProps {
  navigation: any;
}

interface RouteParams {
  phoneNumber: string;
}

export const UserRegistrationScreen: React.FC<UserRegistrationScreenProps> = ({ navigation }) => {
  const route = useRoute();
  const { phoneNumber } = route.params as RouteParams;

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    gender: '',
    birthDate: '',
    couponCode: '',
  });

  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const couponInputRef = useRef<TextInput>(null);

  const genderOptions = [
    { value: 'male', label: '男性' },
    { value: 'female', label: '女性' },
    { value: 'other', label: 'その他' },
    { value: 'not_specified', label: '未選択' },
  ];

  // フォーム入力ハンドリング
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 生年月日選択
  const handleDateSelection = (year: number, month: number, day: number) => {
    const formattedDate = `${year}年${month}月${day}日`;
    handleInputChange('birthDate', formattedDate);
    setShowDatePicker(false);
  };

  // バリデーション
  const validateForm = (): string | null => {
    if (!formData.firstName.trim()) return 'お名前（名）を入力してください';
    if (!formData.lastName.trim()) return 'お名前（姓）を入力してください';
    if (!formData.email.trim()) return 'メールアドレスを入力してください';
    if (!formData.password.trim()) return 'パスワードを入力してください';
    if (!formData.gender) return '性別を選択してください';
    if (!formData.birthDate) return '生年月日を選択してください';
    if (!agreedToTerms) return '利用規約とプライバシーポリシーに同意してください';

    // メールアドレス形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return 'メールアドレスの形式が正しくありません';
    }

    // パスワード長チェック
    if (formData.password.length < 8) {
      return 'パスワードは8文字以上で入力してください';
    }

    return null;
  };

  // ユーザー登録
  const handleRegistration = async () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert('入力エラー', validationError);
      return;
    }

    setIsLoading(true);

    try {
      // TODO: 実際のAPI呼び出し
      const registrationData = {
        ...formData,
        phoneNumber,
        fullName: `${formData.lastName} ${formData.firstName}`,
      };

      logger.log('Registering user:', registrationData);

      // モック処理（実装時はAPIに置き換える）
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 登録完了画面へ遷移
      navigation.navigate('RegistrationComplete');

    } catch (error) {
      logger.error('Registration error:', error);
      Alert.alert('登録エラー', 'ユーザー登録に失敗しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
      <GoGradientBackground
        colors={['#1e40af', '#1e3a8a', '#1e40af']}
        style={styles.background}
      >
        {/* 戻るボタン */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            bounces={true}
          >
            {/* タイトル */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>ユーザー情報を入力</Text>
            </View>

            {/* フォーム */}
            <View style={styles.formContainer}>
              {/* お名前 */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>
                  ひらがな氏名 <Text style={styles.requiredMark}>必須</Text>
                </Text>
                <Text style={styles.fieldHint}>例）たなかじょー</Text>
                <View style={styles.nameInputContainer}>
                  <TextInput
                    style={[styles.textInput, styles.nameInput]}
                    value={formData.firstName}
                    onChangeText={(text) => handleInputChange('firstName', text)}
                    placeholder=""
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    returnKeyType="next"
                    onSubmitEditing={() => emailInputRef.current?.focus()}
                  />
                </View>
              </View>

              {/* 性別 */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>性別</Text>
                <TouchableOpacity
                  style={styles.pickerInput}
                  onPress={() => setShowGenderPicker(true)}
                >
                  <Text style={[styles.pickerText, !formData.gender && styles.pickerPlaceholder]}>
                    {formData.gender ? genderOptions.find(opt => opt.value === formData.gender)?.label : '未選択'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 生年月日 */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>生年月日</Text>
                <TouchableOpacity
                  style={styles.pickerInput}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={[styles.pickerText, !formData.birthDate && styles.pickerPlaceholder]}>
                    {formData.birthDate || '未入力'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* クーポンコード */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>クーポンコード</Text>
                <TextInput
                  ref={couponInputRef}
                  style={styles.textInput}
                  value={formData.couponCode}
                  onChangeText={(text) => handleInputChange('couponCode', text)}
                  placeholder="コードを入力"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  autoCapitalize="characters"
                  returnKeyType="done"
                />
                <Text style={styles.fieldHint}>
                  クーポンコードはあとから入力することもできます
                </Text>
              </View>

              {/* 利用規約・プライバシーポリシー */}
              <View style={styles.termsContainer}>
                <View style={styles.termsLinks}>
                  <TouchableOpacity style={styles.termsLink}>
                    <Text style={styles.termsLinkText}>利用規約</Text>
                    <Text style={styles.linkIcon}>📋</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.termsLink}>
                    <Text style={styles.termsLinkText}>プライバシーポリシー</Text>
                    <Text style={styles.linkIcon}>📋</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.agreementContainer}
                  onPress={() => setAgreedToTerms(!agreedToTerms)}
                >
                  <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                    {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.agreementText}>
                    利用規約とプライバシーポリシーを確認の上、同意する
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 登録ボタン */}
            <View style={styles.buttonContainer}>
              <GoButton
                title="登録"
                onPress={handleRegistration}
                style={[
                  styles.registerButton,
                  (!agreedToTerms || isLoading) && styles.registerButtonDisabled
                ]}
                textStyle={[
                  styles.registerButtonText,
                  (!agreedToTerms || isLoading) && styles.registerButtonTextDisabled
                ]}
                disabled={!agreedToTerms || isLoading}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* 性別選択モーダル */}
        <Modal
          visible={showGenderPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowGenderPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>性別を選択</Text>
              {genderOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.modalOption}
                  onPress={() => {
                    handleInputChange('gender', option.value);
                    setShowGenderPicker(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowGenderPicker(false)}
              >
                <Text style={styles.modalCancelText}>キャンセル</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </GoGradientBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    paddingTop: 100, // 戻るボタン分のスペースを確保
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20, // KeyboardAvoidingViewでpaddingTopを設定したため削減
    paddingBottom: 80, // 下部のpadding増加でボタンが見やすくなる
    paddingHorizontal: 0,
  },

  // タイトル
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },

  // フォーム
  formContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  fieldContainer: {
    marginBottom: 30,
  },
  fieldLabel: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 8,
    fontWeight: '600',
  },
  requiredMark: {
    backgroundColor: '#ef4444',
    color: '#ffffff',
    fontSize: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  fieldHint: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  textInput: {
    fontSize: 16,
    color: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 0,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
    fontWeight: '500',
  },
  nameInputContainer: {
    flexDirection: 'row',
  },
  nameInput: {
    flex: 1,
  },
  pickerInput: {
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
  },
  pickerText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  pickerPlaceholder: {
    color: 'rgba(255, 255, 255, 0.5)',
  },

  // 利用規約
  termsContainer: {
    marginTop: 20,
  },
  termsLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  termsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    paddingVertical: 8,
  },
  termsLinkText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textDecorationLine: 'underline',
    marginRight: 4,
  },
  linkIcon: {
    fontSize: 14,
  },
  agreementContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 12,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  checkmark: {
    color: '#1e40af',
    fontSize: 16,
    fontWeight: 'bold',
  },
  agreementText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },

  // ボタン
  buttonContainer: {
    paddingHorizontal: 20,
  },
  registerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 50,
    paddingVertical: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  registerButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  registerButtonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.5)',
  },

  // モーダル
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#374151',
  },
  modalOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
  },
  modalCancel: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default UserRegistrationScreen;