import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Animated,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoGradientBackground } from '../components/GoStyle/GoGradientBackground';
import { OnboardingSlide } from '../components/onboarding/OnboardingSlide';
import { OnboardingIndicators } from '../components/onboarding/OnboardingIndicators';
import { SimpleSwipeHandler } from '../components/onboarding/SimpleSwipeHandler';
import { AccessibleOnboardingButton } from '../components/onboarding/AccessibleOnboardingButton';
import { onboardingSlides } from '../data/onboardingData';
import { useAccessibility } from '../hooks/useAccessibility';
import { logger } from '../config/environment';
import { HapticUtils } from '../utils/hapticUtils';

const { width: screenWidth } = Dimensions.get('window');

interface OnboardingScreenProps {
  navigation: any;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<any>(null);
  const accessibility = useAccessibility();

  // オンボーディング完了フラグを設定
  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('onboarding_completed', 'true');
      logger.log('Onboarding completed flag set');
    } catch (error) {
      logger.error('Failed to set onboarding completion:', error);
    }
  };

  // 新規登録フローへ遷移
  const handleFirstTimeUser = async () => {
    if (HapticUtils.isAvailable() && !HapticUtils.shouldDisableForAccessibility(accessibility.isReduceMotionEnabled)) {
      HapticUtils.success();
    }
    await completeOnboarding();
    navigation.replace('Login', { isSignup: true });
  };

  // ログイン画面へ遷移
  const handleExistingUser = async () => {
    if (HapticUtils.isAvailable() && !HapticUtils.shouldDisableForAccessibility(accessibility.isReduceMotionEnabled)) {
      HapticUtils.success();
    }
    await completeOnboarding();
    navigation.replace('Login', { isSignup: false });
  };

  // スライド変更ハンドラー
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentSlide(viewableItems[0].index);
    }
  }).current;

  // スワイプナビゲーション
  const handleSwipeLeft = () => {
    if (currentSlide < onboardingSlides.length - 1) {
      const nextSlide = currentSlide + 1;
      setCurrentSlide(nextSlide);
      flatListRef.current?.scrollToIndex({ index: nextSlide, animated: true });
    }
  };

  const handleSwipeRight = () => {
    if (currentSlide > 0) {
      const prevSlide = currentSlide - 1;
      setCurrentSlide(prevSlide);
      flatListRef.current?.scrollToIndex({ index: prevSlide, animated: true });
    }
  };

  // スライドコンテンツのレンダリング
  const renderSlideContent = ({ item, index }: any) => {
    return <OnboardingSlide item={item} index={index} />;
  };

  return (
    <SafeAreaView 
      style={styles.container}
      accessibilityLabel="オンボーディング画面"
      accessible={true}
    >
      <StatusBar barStyle="light-content" backgroundColor="#1B2951" />
      <GoGradientBackground
        colors={['#1B2951', '#2E4F8C', '#4A90E2']}
        locations={[0.0, 0.5, 1.0]}
        start={{x: 0.0, y: 0.0}}
        end={{x: 1.0, y: 1.0}}
        style={styles.background}
      >
        <SimpleSwipeHandler
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
          currentSlide={currentSlide}
          totalSlides={onboardingSlides.length}
          disabled={accessibility.isScreenReaderEnabled}
        >
            <View style={styles.content}>
              {/* スライドコンテンツ */}
              <View 
                style={styles.slidesContainer}
                accessibilityLabel={`スライド ${currentSlide + 1} / ${onboardingSlides.length}`}
              >
                <Animated.FlatList
                  ref={flatListRef}
                  data={onboardingSlides}
                  renderItem={renderSlideContent}
                  keyExtractor={(item) => item.id.toString()}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  scrollEnabled={!accessibility.isScreenReaderEnabled} // VoiceOver時はスクロール無効
                  onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false }
                  )}
                  onViewableItemsChanged={onViewableItemsChanged}
                  viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                  scrollEventThrottle={16}
                  accessibilityLabel="オンボーディングスライド"
                />
              </View>

              {/* ドットインジケータ */}
              <View
                style={styles.indicatorContainer}
                accessibilityLabel={`ページインジケーター: ${currentSlide + 1} / ${onboardingSlides.length}`}
                accessibilityRole="progressbar"
              >
                <OnboardingIndicators 
                  data={onboardingSlides}
                  scrollX={scrollX}
                  screenWidth={screenWidth}
                />
              </View>

              {/* ボタンエリア */}
              <View style={styles.buttonContainer}>
                <AccessibleOnboardingButton
                  title="はじめてGOを利用"
                  onPress={handleFirstTimeUser}
                  variant="primary"
                  accessibilityLabel="新規アカウント作成"
                  accessibilityHint="タクシー予約アプリの新規アカウントを作成します"
                />
                <AccessibleOnboardingButton
                  title="アカウントをお持ちの方"
                  onPress={handleExistingUser}
                  variant="secondary"
                  accessibilityLabel="既存アカウントでログイン"
                  accessibilityHint="すでにお持ちのアカウントでログインします"
                />
              </View>
            </View>
        </SimpleSwipeHandler>
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
  
  content: {
    flex: 1,
    paddingTop: 20, // パディングを減らしてスマホカードにより多くのスペースを確保
  },
  
  slidesContainer: {
    flex: 1,
  },
  
  indicatorContainer: {
    marginTop: 32,
    marginBottom: 24,
  },
  
  buttonContainer: {
    paddingHorizontal: 32,
    paddingBottom: 40,
    gap: 16,
  },
  
  primaryButton: {
    backgroundColor: '#0D1B2A',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: 'rgba(13, 27, 42, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 6,
  },
  
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 12,
  },
  
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});