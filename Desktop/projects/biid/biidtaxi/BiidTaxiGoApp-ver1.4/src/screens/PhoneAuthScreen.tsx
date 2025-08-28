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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { GoButton } from '../components/GoStyle/GoButton';
import { GoGradientBackground } from '../components/GoStyle/GoGradientBackground';
import { logger } from '../config/environment';

interface PhoneAuthScreenProps {
  navigation: any;
}

export const PhoneAuthScreen: React.FC<PhoneAuthScreenProps> = ({ navigation }) => {
  const [countryCode, setCountryCode] = useState('+81');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const phoneInputRef = useRef<TextInput>(null);

  // 電話番号の形式チェック
  const validatePhoneNumber = (number: string): boolean => {
    // 日本の携帯電話番号（11桁）
    const phoneRegex = /^0[7-9]0\d{8}$|^[7-9]0\d{8}$/;
    return phoneRegex.test(number.replace(/\D/g, ''));
  };

  // 電話番号フォーマット
  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    let formatted = cleaned;
    
    if (cleaned.length >= 3) {
      formatted = `${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7, 11)}`;
    }
    
    return formatted;
  };

  // 認証コード送信
  const handleSendVerificationCode = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('エラー', '電話番号を入力してください');
      return;
    }

    const cleanedNumber = phoneNumber.replace(/\D/g, '');
    if (!validatePhoneNumber(cleanedNumber)) {
      Alert.alert('エラー', '正しい電話番号を入力してください');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: 実際のAPI呼び出し
      const fullPhoneNumber = `${countryCode}${cleanedNumber.startsWith('0') ? cleanedNumber.slice(1) : cleanedNumber}`;
      logger.log('Sending verification code to:', fullPhoneNumber);

      // モック処理（実装時はAPIに置き換える）
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 認証コード入力画面へ遷移
      navigation.navigate('VerificationCode', {
        phoneNumber: fullPhoneNumber,
        formattedPhone: `${countryCode} ${formatPhoneNumber(phoneNumber)}`,
      });

    } catch (error) {
      logger.error('Phone auth error:', error);
      Alert.alert('エラー', '認証コードの送信に失敗しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneNumberChange = (text: string) => {
    // 数字とスペースのみ許可
    const cleaned = text.replace(/[^\d\s]/g, '');
    setPhoneNumber(cleaned);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
      <GoGradientBackground
        colors={['#1e40af', '#1e3a8a', '#1e40af']}
        style={styles.background}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* 戻るボタン */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          <View style={styles.content}>
            {/* タイトル */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>GOをはじめましょう</Text>
              <Text style={styles.subtitle}>
                SMSを受信できる携帯電話番号を入力してください
              </Text>
            </View>

            {/* 電話番号入力 */}
            <View style={styles.phoneInputContainer}>
              {/* 国番号選択 */}
              <TouchableOpacity style={styles.countryCodeContainer}>
                <Text style={styles.countryCode}>{countryCode}</Text>
                <Text style={styles.dropdownArrow}>›</Text>
              </TouchableOpacity>

              {/* 電話番号入力 */}
              <View style={styles.phoneNumberContainer}>
                <TextInput
                  ref={phoneInputRef}
                  style={styles.phoneNumberInput}
                  value={phoneNumber}
                  onChangeText={handlePhoneNumberChange}
                  placeholder="080 1234 5678"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  keyboardType="phone-pad"
                  maxLength={13} // スペース込みで13文字
                  returnKeyType="done"
                  onSubmitEditing={handleSendVerificationCode}
                />
              </View>
            </View>

            {/* 認証コード送信ボタン */}
            <View style={styles.buttonContainer}>
              <GoButton
                title="認証コードを送信する"
                onPress={handleSendVerificationCode}
                style={[
                  styles.sendButton,
                  (!phoneNumber.trim() || isLoading) && styles.sendButtonDisabled
                ]}
                textStyle={[
                  styles.sendButtonText,
                  (!phoneNumber.trim() || isLoading) && styles.sendButtonTextDisabled
                ]}
                disabled={!phoneNumber.trim() || isLoading}
              />
            </View>

            {/* ログインリンク */}
            <View style={styles.loginLinkContainer}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                style={styles.loginLink}
              >
                <Text style={styles.loginLinkText}>
                  アカウントをお持ちの方
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 120,
    justifyContent: 'center',
  },

  // タイトル
  titleContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },

  // 電話番号入力
  phoneInputContainer: {
    flexDirection: 'row',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingRight: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
    marginRight: 20,
  },
  countryCode: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '600',
    marginRight: 8,
  },
  dropdownArrow: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.6)',
    transform: [{ rotate: '90deg' }],
  },
  phoneNumberContainer: {
    flex: 1,
  },
  phoneNumberInput: {
    fontSize: 18,
    color: '#ffffff',
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
    fontWeight: '600',
  },

  // ボタン
  buttonContainer: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  sendButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 50,
    paddingVertical: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  sendButtonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.5)',
  },

  // ログインリンク
  loginLinkContainer: {
    alignItems: 'center',
  },
  loginLink: {
    paddingVertical: 12,
  },
  loginLinkText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
});

export default PhoneAuthScreen;