import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
// import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { GoButton } from '../components/GoStyle/GoButton';
import { GoGradientBackground } from '../components/GoStyle/GoGradientBackground';
import { logger } from '../config/environment';

interface LocationPermissionScreenProps {
  navigation: any;
}

export const LocationPermissionScreen: React.FC<LocationPermissionScreenProps> = ({ navigation }) => {

  const handleLocationPermission = async () => {
    try {
      // TODO: 実際の位置情報権限リクエスト実装
      // const result = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
      
      logger.log('Location permission requested (mock)');
      
      // モック処理：自動的に電話認証画面に遷移
      Alert.alert(
        '位置情報の許可',
        'GOアプリが位置情報にアクセスすることを許可しますか？',
        [
          { 
            text: '許可しない', 
            style: 'cancel',
            onPress: () => {
              // 許可しない場合でも続行
              navigation.replace('PhoneAuth');
            }
          },
          { 
            text: '許可', 
            onPress: () => {
              logger.log('Location permission granted (mock)');
              navigation.replace('PhoneAuth');
            }
          },
        ]
      );

    } catch (error) {
      logger.error('Location permission error:', error);
      // エラー時も続行
      navigation.replace('PhoneAuth');
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

        <View style={styles.content}>
          {/* イラストレーション */}
          <View style={styles.illustrationContainer}>
            <View style={styles.cityscape}>
              {/* ビル群 */}
              <View style={[styles.building, { height: 80, left: 20 }]} />
              <View style={[styles.building, { height: 120, left: 50, backgroundColor: '#60a5fa' }]} />
              <View style={[styles.building, { height: 100, left: 80 }]} />
              <View style={[styles.building, { height: 140, left: 110, backgroundColor: '#60a5fa' }]} />
              <View style={[styles.building, { height: 90, left: 140 }]} />
              <View style={[styles.building, { height: 110, left: 170, backgroundColor: '#60a5fa' }]} />
              
              {/* 雲 */}
              <View style={[styles.cloud, { top: 20, right: 50 }]} />
              <View style={[styles.cloud, { top: 40, right: 100 }]} />
              
              {/* 人物 */}
              <View style={styles.person}>
                <View style={styles.personHead} />
                <View style={styles.personBody} />
                <View style={styles.personPhone} />
              </View>
              
              {/* 地図パネル */}
              <View style={styles.mapPanel}>
                <View style={styles.mapGrid} />
                <View style={[styles.mapLine, { top: 20, left: 10, width: 60 }]} />
                <View style={[styles.mapLine, { top: 40, left: 20, width: 40 }]} />
                <View style={styles.locationPin} />
              </View>
            </View>
          </View>

          {/* テキストコンテンツ */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>まずは位置情報の設定から</Text>
            <Text style={styles.subtitle}>
              位置情報を許可すると{'\n'}スムーズな配車ができます
            </Text>
          </View>

          {/* 機能説明カード */}
          <View style={styles.featureCard}>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <View style={styles.pickupIcon} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>乗車地の設定が簡単に</Text>
                <Text style={styles.featureDescription}>
                  現在地周辺の配車可能な場所へガイドします
                </Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <View style={styles.meetingIcon} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>待ち合わせがスムーズに</Text>
                <Text style={styles.featureDescription}>
                  位置情報によって、正確な待ち合わせ場所に乗務員が向かうことができます
                </Text>
              </View>
            </View>
          </View>

          {/* 位置情報取得について */}
          <TouchableOpacity style={styles.privacyLink}>
            <Text style={styles.privacyText}>位置情報の取得について</Text>
            <Text style={styles.privacyIcon}>📋</Text>
          </TouchableOpacity>
        </View>

        {/* 次へボタン */}
        <View style={styles.buttonContainer}>
          <GoButton
            title="次へ"
            onPress={handleLocationPermission}
            style={styles.nextButton}
            textStyle={styles.nextButtonText}
          />
        </View>
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
    justifyContent: 'space-between',
  },
  
  // イラストレーション
  illustrationContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  cityscape: {
    width: 300,
    height: 160,
    position: 'relative',
  },
  building: {
    position: 'absolute',
    bottom: 0,
    width: 25,
    backgroundColor: '#94a3b8',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  cloud: {
    position: 'absolute',
    width: 30,
    height: 20,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    opacity: 0.9,
  },
  person: {
    position: 'absolute',
    bottom: 20,
    left: 40,
  },
  personHead: {
    width: 20,
    height: 20,
    backgroundColor: '#fbbf24',
    borderRadius: 10,
    marginBottom: 2,
  },
  personBody: {
    width: 16,
    height: 25,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    marginLeft: 2,
  },
  personPhone: {
    position: 'absolute',
    top: 15,
    right: -8,
    width: 6,
    height: 10,
    backgroundColor: '#374151',
    borderRadius: 2,
  },
  mapPanel: {
    position: 'absolute',
    top: 20,
    right: 40,
    width: 100,
    height: 80,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 8,
  },
  mapGrid: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
  },
  mapLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#9ca3af',
    borderRadius: 1,
  },
  locationPin: {
    position: 'absolute',
    top: 30,
    left: 40,
    width: 12,
    height: 12,
    backgroundColor: '#3b82f6',
    borderRadius: 6,
  },
  
  // テキストコンテンツ
  textContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  
  // 機能説明カード
  featureCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  featureIcon: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  pickupIcon: {
    width: 16,
    height: 16,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  meetingIcon: {
    width: 20,
    height: 12,
    backgroundColor: '#1e40af',
    borderRadius: 6,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  
  // プライバシーリンク
  privacyLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  privacyText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginRight: 8,
  },
  privacyIcon: {
    fontSize: 16,
  },
  
  // ボタン
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  nextButton: {
    backgroundColor: '#ffffff',
    borderRadius: 50,
    paddingVertical: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  nextButtonText: {
    color: '#1e40af',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default LocationPermissionScreen;