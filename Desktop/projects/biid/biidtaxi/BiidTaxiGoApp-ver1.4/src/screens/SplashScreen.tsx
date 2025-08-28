import React, {useEffect} from 'react';
import {View, Text, StyleSheet, Dimensions, StatusBar} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {GoTheme} from '../theme/GoTheme';
import {logger} from '../config/environment';

export interface SplashScreenProps {
  navigation: any;
}

const {width, height} = Dimensions.get('window');

export const SplashScreen: React.FC<SplashScreenProps> = ({navigation}) => {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 初回起動判定のため、既存の状態を確認
        
        // オンボーディング完了チェック
        const onboardingCompleted = await AsyncStorage.getItem('onboarding_completed');
        const authToken = await AsyncStorage.getItem('auth_token');
        
        logger.log('Onboarding completed:', onboardingCompleted);
        logger.log('Auth token exists:', !!authToken);
        
        // スプラッシュ表示時間
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        if (onboardingCompleted === 'true') {
          if (authToken) {
            // オンボーディング完了 + 認証済み → ホーム画面
            navigation.replace('Main'); // GO仕様: ボトムタブナビゲーターへ
          } else {
            // オンボーディング完了 + 未認証 → ログイン画面
            navigation.replace('Login');
          }
        } else {
          // 初回起動 → オンボーディング画面
          navigation.replace('Onboarding');
        }
      } catch (error) {
        logger.error('Splash screen initialization error:', error);
        // エラー時は安全にオンボーディングを表示
        navigation.replace('Onboarding');
      }
    };

    initializeApp();
  }, [navigation]);

  return (
    <>
      <StatusBar backgroundColor={GoTheme.colors.background} barStyle="dark-content" />
      <View style={styles.container}>
        {/* GOスタイルロゴエリア */}
        <View style={styles.logoContainer}>
          {/* GO文字 */}
          <View style={styles.logoTextContainer}>
            <Text style={styles.logoG}>G</Text>
            <View style={styles.logoO}>
              <View style={styles.gradientCircle} />
            </View>
          </View>
          
          {/* タグライン */}
          <Text style={styles.tagline}>TAXI GOes Next.</Text>
        </View>
        
        {/* BiidTaxi識別テキスト */}
        <View style={styles.bottomContainer}>
          <Text style={styles.appName}>BiidTaxi</Text>
          <Text style={styles.subtitle}>タクシー＆船舶予約アプリ</Text>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GoTheme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: height * 0.15,
  },
  logoTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoG: {
    fontSize: 80,
    fontWeight: 'bold',
    color: GoTheme.colors.text,
    marginRight: 8,
  },
  logoO: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: GoTheme.colors.accent,
    // グラデーション効果をシミュレート
    shadowColor: GoTheme.colors.primaryLight,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  tagline: {
    ...GoTheme.typography.h3,
    color: GoTheme.colors.text,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: height * 0.15,
    alignItems: 'center',
  },
  appName: {
    ...GoTheme.typography.h2,
    color: GoTheme.colors.primary,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.textSecondary,
    textAlign: 'center',
  },
});