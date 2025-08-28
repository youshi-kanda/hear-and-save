import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Animated,
  Vibration,
} from 'react-native';
import {GoButton, GoCard, GoHeader} from '../components/GoStyle';
import {GoTheme} from '../theme/GoTheme';
import {qrService, QRPaymentData} from '../services/api/qrService';

// React Native用のQRコードスキャナーライブラリをシミュレート
// 実際の実装では react-native-qrcode-scanner などを使用
interface QRScannerProps {
  onRead: (e: {data: string}) => void;
  reactivate?: boolean;
  reactivateTimeout?: number;
  cameraStyle?: any;
  topViewStyle?: any;
  bottomViewStyle?: any;
}

const MockQRScanner: React.FC<QRScannerProps> = ({onRead, cameraStyle}) => {
  const [scanning, setScanning] = useState(true);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    const pulseAnimation = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (scanning) {
          pulseAnimation();
        }
      });
    };

    if (scanning) {
      pulseAnimation();
    }
  }, [scanning, pulseAnim]);

  // デモ用のStripe QR決済コード
  const mockStripeQRCodes = [
    'pi_3OGqVGLkdIwHu7ix0123456789_stripe_taxi_fare',
    'pi_3OGqVHLkdIwHu7ix0987654321_stripe_ship_fare', 
    'pi_3OGqVILkdIwHu7ix0147852369_stripe_service_fee',
    'pi_3OGqVJLkdIwHu7ix0369258147_stripe_parking_fee',
  ];

  const simulateScan = () => {
    if (!scanning) return;
    
    const randomQR = mockStripeQRCodes[Math.floor(Math.random() * mockStripeQRCodes.length)];
    setScanning(false);
    onRead({data: randomQR});
  };

  return (
    <View style={[styles.camera, cameraStyle]}>
      <View style={styles.scannerOverlay}>
        <View style={styles.scannerFrame}>
          <Animated.View
            style={[
              styles.scannerCorner,
              styles.topLeft,
              {transform: [{scale: pulseAnim}]},
            ]}
          />
          <Animated.View
            style={[
              styles.scannerCorner,
              styles.topRight,
              {transform: [{scale: pulseAnim}]},
            ]}
          />
          <Animated.View
            style={[
              styles.scannerCorner,
              styles.bottomLeft,
              {transform: [{scale: pulseAnim}]},
            ]}
          />
          <Animated.View
            style={[
              styles.scannerCorner,
              styles.bottomRight,
              {transform: [{scale: pulseAnim}]},
            ]}
          />
          
          <View style={styles.scanLine} />
        </View>
        
        <TouchableOpacity 
          style={styles.mockScanButton} 
          onPress={simulateScan}
          disabled={!scanning}>
          <Text style={styles.mockScanText}>
            {scanning ? 'テストスキャン' : 'スキャン中...'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export interface QRScannerScreenProps {
  navigation: any;
}

export const QRScannerScreen: React.FC<QRScannerScreenProps> = ({navigation}) => {
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [lastScanData, setLastScanData] = useState<string | null>(null);
  const [flashEnabled, setFlashEnabled] = useState(false);

  const handleQRCodeScanned = async (e: {data: string}) => {
    if (!scanning || loading) return;

    const qrData = e.data;
    
    // 同じQRコードの連続スキャンを防ぐ
    if (qrData === lastScanData) return;
    
    setLastScanData(qrData);
    setLoading(true);
    setScanning(false);

    // バイブレーション
    Vibration.vibrate(100);

    try {
      console.log('Stripe QR決済コードをスキャンしました:', qrData);
      
      // まずQR決済コードの有効性を確認
      const validationResponse = await qrService.validateQRPaymentCode(qrData);
      
      if (!validationResponse.success) {
        Alert.alert('無効なQRコード', '有効なStripe決済QRコードをスキャンしてください');
        resetScanner();
        return;
      }

      // QR決済コードをスキャンしてデータを取得
      const response = await qrService.scanQRPaymentCode(qrData);
      
      if (response.success && response.data) {
        const qrPaymentData = response.data;
        
        // QR決済のタイプに応じて処理
        switch (qrPaymentData.type) {
          case 'stripe_payment':
            handleStripePaymentQR(qrPaymentData);
            break;
          case 'taxi_fare':
            handleTaxiFarePaymentQR(qrPaymentData);
            break;
          case 'ship_fare':
            handleShipFarePaymentQR(qrPaymentData);
            break;
          case 'service_payment':
            handleServicePaymentQR(qrPaymentData);
            break;
          default:
            Alert.alert('未対応の決済QRコード', 'このQR決済タイプは現在サポートされていません');
            resetScanner();
        }
      } else {
        Alert.alert('エラー', response.error || 'QR決済コードの処理に失敗しました');
        resetScanner();
      }
    } catch (error) {
      console.error('QRコードスキャンエラー:', error);
      Alert.alert('エラー', 'QRコードの処理中にエラーが発生しました');
      resetScanner();
    } finally {
      setLoading(false);
    }
  };

  const handleStripePaymentQR = async (qrData: QRPaymentData) => {
    const serviceType = qrData.metadata.service_type;
    const serviceIcon = serviceType === 'taxi' ? '🚗' : serviceType === 'ship' ? '🚢' : '💳';
    const serviceName = serviceType === 'taxi' ? 'タクシー' : serviceType === 'ship' ? '船舶' : 'サービス';
    
    Alert.alert(
      `${serviceIcon} Stripe決済`,
      `${serviceName}料金: ¥${qrData.amount.toLocaleString()}\n${qrData.description}\n\nStripeで決済を進めますか？`,
      [
        { text: 'キャンセル', style: 'cancel', onPress: resetScanner },
        { 
          text: '決済画面へ', 
          onPress: () => {
            navigation.navigate('Payment', {
              qrPayment: true,
              paymentData: qrData,
            });
          }
        },
      ]
    );
  };

  const handleTaxiFarePaymentQR = async (qrData: QRPaymentData) => {
    const routeInfo = qrData.metadata.pickup_address && qrData.metadata.destination_address
      ? `${qrData.metadata.pickup_address} → ${qrData.metadata.destination_address}`
      : 'タクシー料金';
    
    Alert.alert(
      '🚗 タクシー料金決済',
      `料金: ¥${qrData.amount.toLocaleString()}\n${routeInfo}\n距離: ${qrData.metadata.distance || 0}km\n時間: ${qrData.metadata.duration || 0}分\n\nStripeで決済しますか？`,
      [
        { text: 'キャンセル', style: 'cancel', onPress: resetScanner },
        { 
          text: '決済する', 
          onPress: () => {
            navigation.navigate('Payment', {
              qrPayment: true,
              paymentData: qrData,
            });
          }
        },
      ]
    );
  };

  const handleShipFarePaymentQR = async (qrData: QRPaymentData) => {
    const vesselInfo = qrData.metadata.vessel_id
      ? `船舶: ${qrData.metadata.vessel_id}`
      : '';
    
    Alert.alert(
      '🚢 船舶料金決済',
      `料金: ¥${qrData.amount.toLocaleString()}\n${qrData.description}\n${vesselInfo}\n\nStripeで決済しますか？`,
      [
        { text: 'キャンセル', style: 'cancel', onPress: resetScanner },
        { 
          text: '決済する', 
          onPress: () => {
            navigation.navigate('Payment', {
              qrPayment: true,
              paymentData: qrData,
            });
          }
        },
      ]
    );
  };

  const handleServicePaymentQR = async (qrData: QRPaymentData) => {
    Alert.alert(
      '💳 サービス料金決済',
      `料金: ¥${qrData.amount.toLocaleString()}\n${qrData.description}\n\nStripeで決済しますか？`,
      [
        { text: 'キャンセル', style: 'cancel', onPress: resetScanner },
        { 
          text: '決済する', 
          onPress: () => {
            navigation.navigate('Payment', {
              qrPayment: true,
              paymentData: qrData,
            });
          }
        },
      ]
    );
  };

  const resetScanner = () => {
    setTimeout(() => {
      setScanning(true);
      setLastScanData(null);
    }, 2000);
  };

  const toggleFlash = () => {
    setFlashEnabled(!flashEnabled);
  };

  return (
    <SafeAreaView style={styles.container}>
      <GoHeader
        title="QRコードスキャン"
        showBack={true}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.cameraContainer}>
        <MockQRScanner
          onRead={handleQRCodeScanned}
          reactivate={scanning}
          reactivateTimeout={2000}
          cameraStyle={styles.camera}
        />
      </View>

      <GoCard style={styles.instructionCard}>
        <Text style={styles.instructionTitle}>Stripe QR決済</Text>
        <Text style={styles.instructionText}>
          タクシーや船舶の料金支払いQRコードをスキャンして、
          Stripeで安全に決済できます。
        </Text>
        
        <View style={styles.supportedTypes}>
          <Text style={styles.supportedTitle}>対応QR決済:</Text>
          <Text style={styles.supportedItem}>🚗 タクシー料金</Text>
          <Text style={styles.supportedItem}>🚢 船舶料金</Text>
          <Text style={styles.supportedItem}>💳 各種サービス料金</Text>
          <Text style={styles.supportedItem}>🔒 Stripe安全決済</Text>
        </View>
      </GoCard>

      <View style={styles.controlsContainer}>
        <GoButton
          variant="secondary"
          size="large"
          onPress={toggleFlash}
          style={styles.controlButton}>
          {flashEnabled ? '💡 フラッシュOFF' : '🔦 フラッシュON'}
        </GoButton>
        
        <GoButton
          variant="secondary"
          size="large"
          onPress={() => navigation.navigate('Home')}
          style={styles.controlButton}>
          ホームへ戻る
        </GoButton>
      </View>
    </SafeAreaView>
  );
};

const {width, height} = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GoTheme.colors.background,
  },
  cameraContainer: {
    flex: 1,
    marginHorizontal: GoTheme.spacing.md,
    marginTop: GoTheme.spacing.md,
    borderRadius: GoTheme.borderRadius.lg,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderRadius: GoTheme.borderRadius.lg,
  },
  scannerCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: GoTheme.colors.primary,
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: GoTheme.borderRadius.lg,
  },
  topRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: GoTheme.borderRadius.lg,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomLeftRadius: GoTheme.borderRadius.lg,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomRightRadius: GoTheme.borderRadius.lg,
  },
  scanLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: GoTheme.colors.primary,
    opacity: 0.8,
  },
  mockScanButton: {
    marginTop: 40,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: GoTheme.colors.primary,
    borderRadius: GoTheme.borderRadius.md,
  },
  mockScanText: {
    color: GoTheme.colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  instructionCard: {
    marginHorizontal: GoTheme.spacing.md,
    marginVertical: GoTheme.spacing.md,
    alignItems: 'center',
  },
  instructionTitle: {
    ...GoTheme.typography.h3,
    color: GoTheme.colors.text,
    fontWeight: 'bold',
    marginBottom: GoTheme.spacing.sm,
  },
  instructionText: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: GoTheme.spacing.md,
  },
  supportedTypes: {
    alignItems: 'center',
  },
  supportedTitle: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.text,
    fontWeight: '600',
    marginBottom: GoTheme.spacing.xs,
  },
  supportedItem: {
    ...GoTheme.typography.bodySmall,
    color: GoTheme.colors.textSecondary,
    marginBottom: 2,
  },
  controlsContainer: {
    flexDirection: 'row',
    paddingHorizontal: GoTheme.spacing.md,
    paddingVertical: GoTheme.spacing.lg,
    gap: GoTheme.spacing.md,
  },
  controlButton: {
    flex: 1,
  },
});