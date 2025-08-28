import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { GoStyleMap } from '../Map/GoStyleMap';
import { GoButton } from '../GoStyle/GoButton';
import { GoCard } from '../GoStyle/GoCard';
import { GoTheme } from '../../theme/GoTheme';
import { useTheme } from '../../contexts/ThemeContext';
import { logger } from '../../config/environment';

const { width: screenWidth } = Dimensions.get('window');

interface QuickBookingTabProps {
  currentMode: 'taxi' | 'ship';
}

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
}

export const QuickBookingTab: React.FC<QuickBookingTabProps> = ({ currentMode }) => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  
  const [currentLocation, setCurrentLocation] = useState<LocationData>({
    latitude: 34.6851,
    longitude: 135.5136,
    address: '大阪市中央区南船場4丁目5-10'
  });
  
  const [destination, setDestination] = useState<LocationData | null>(null);
  const [estimatedTime, setEstimatedTime] = useState('1-4');

  // 位置情報取得
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      // TODO: 実際の位置情報取得実装
      logger.log('Getting current location...');
      
      // モック位置情報（大阪・南船場）
      const mockLocation = {
        latitude: 34.6851,
        longitude: 135.5136,
        address: '大阪市中央区南船場4丁目5-10'
      };
      
      setCurrentLocation(mockLocation);
      
    } catch (error) {
      logger.error('Location error:', error);
      Alert.alert('位置情報エラー', '現在地を取得できませんでした');
    }
  };

  // 次へ進むボタンハンドラー
  const handleNext = () => {
    if (currentMode === 'taxi') {
      // タクシー予約画面へ
      navigation.navigate('TaxiSelection', {
        pickup: currentLocation,
        destination: destination,
      });
    } else {
      // 船舶予約画面へ
      navigation.navigate('ShipBooking');
    }
  };

  // 目的地設定ハンドラー
  const handleDestinationSearch = () => {
    // 目的地検索画面へ（既存の機能を活用）
    Alert.alert('目的地検索', '目的地検索機能を実装中です');
  };

  return (
    <View style={styles.container}>
      {/* 地図エリア */}
      <View style={styles.mapContainer}>
        <GoStyleMap
          initialLocation={currentLocation}
          style={styles.map}
          showUserLocation={true}
          mode={currentMode}
        />
        
        {/* 現在地確認カード */}
        <View style={styles.locationCardContainer}>
          <GoCard style={styles.locationCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.warningText}>
                {currentMode === 'taxi' ? '乗車地が正しいかご確認ください（GPS精度低下）' : '乗船地が正しいかご確認ください'}
              </Text>
            </View>
            <Text style={styles.locationAddress}>{currentLocation.address}</Text>
            
            {currentMode === 'taxi' && (
              <TouchableOpacity style={styles.etaButton}>
                <Text style={styles.etaButtonText}>約{estimatedTime}分で乗車</Text>
              </TouchableOpacity>
            )}
          </GoCard>
        </View>
      </View>

      {/* ボトムシートエリア */}
      <View style={styles.bottomSheet}>
        {/* 出発地 */}
        <View style={styles.inputContainer}>
          <View style={styles.locationInput}>
            <Text style={styles.locationIcon}>📍</Text>
            <View style={styles.inputTextContainer}>
              <Text style={styles.inputLabel}>
                {currentMode === 'taxi' ? '乗車地' : '乗船地'}
              </Text>
              <Text style={styles.inputText} numberOfLines={1}>
                {currentLocation.address}
              </Text>
            </View>
            <TouchableOpacity style={styles.searchButton}>
              <Text style={styles.searchIcon}>🔍</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 目的地 */}
        <View style={styles.inputContainer}>
          <TouchableOpacity 
            style={styles.locationInput}
            onPress={handleDestinationSearch}
          >
            <Text style={styles.locationIcon}>🎯</Text>
            <View style={styles.inputTextContainer}>
              <Text style={styles.inputLabel}>
                {currentMode === 'taxi' ? '目的地' : '下船地'}
              </Text>
              <Text style={[styles.inputText, !destination && styles.placeholderText]}>
                {destination ? destination.address : '指定なし'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* メインアクションボタン */}
        <View style={styles.buttonContainer}>
          <GoButton
            title="次へすすむ"
            onPress={handleNext}
            style={[styles.nextButton, { backgroundColor: colors.primary }]}
            textStyle={styles.nextButtonText}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  locationCardContainer: {
    position: 'absolute',
    top: 80, // ヘッダーの下に配置
    left: GoTheme.spacing.md,
    right: GoTheme.spacing.md,
    zIndex: 1,
    alignItems: 'center',
  },
  locationCard: {
    padding: GoTheme.spacing.md,
    backgroundColor: GoTheme.colors.surface,
    maxWidth: 320, // 見本に合わせて適切な幅に制限
    minWidth: 280,
    ...GoTheme.shadows.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: GoTheme.spacing.sm,
    paddingHorizontal: GoTheme.spacing.sm,
    paddingVertical: GoTheme.spacing.xs,
    backgroundColor: GoTheme.colors.warning + '15',
    borderRadius: GoTheme.borderRadius.sm,
    borderLeftWidth: 4,
    borderLeftColor: GoTheme.colors.warning,
  },
  warningIcon: {
    fontSize: 16,
    marginRight: GoTheme.spacing.sm,
  },
  warningText: {
    flex: 1,
    ...GoTheme.typography.captionSmall,
    color: GoTheme.colors.warning,
    fontWeight: '600',
    lineHeight: 18,
  },
  locationAddress: {
    ...GoTheme.typography.body,
    fontSize: 16,
    fontWeight: '600',
    color: GoTheme.colors.text,
    marginBottom: GoTheme.spacing.sm,
  },
  etaButton: {
    backgroundColor: GoTheme.colors.primary, // #1B2951 濃紺背景
    paddingHorizontal: GoTheme.spacing.xl,
    paddingVertical: GoTheme.spacing.md,
    borderRadius: GoTheme.borderRadius.lg,
    alignSelf: 'center', // 中央揃えに変更
    marginTop: GoTheme.spacing.sm,
    ...GoTheme.shadows.medium,
  },
  etaButtonText: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.textOnPrimary,
    fontSize: 15,
    fontWeight: '600',
  },

  // ボトムシート
  bottomSheet: {
    backgroundColor: GoTheme.colors.surface,
    paddingTop: GoTheme.spacing.lg,
    paddingHorizontal: GoTheme.spacing.md,
    paddingBottom: GoTheme.spacing.xxl,
    borderTopLeftRadius: GoTheme.borderRadius.xl,
    borderTopRightRadius: GoTheme.borderRadius.xl,
    ...GoTheme.shadows.sheet,
  },
  inputContainer: {
    marginBottom: GoTheme.spacing.md,
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GoTheme.colors.surface,
    paddingVertical: GoTheme.spacing.lg,
    paddingHorizontal: GoTheme.spacing.md,
    borderRadius: GoTheme.borderRadius.lg,
    marginBottom: GoTheme.spacing.sm,
    borderWidth: 1,
    borderColor: GoTheme.colors.border,
    ...GoTheme.shadows.small,
  },
  locationIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  inputTextContainer: {
    flex: 1,
  },
  inputLabel: {
    ...GoTheme.typography.captionSmall,
    color: GoTheme.colors.textSecondary,
    marginBottom: GoTheme.spacing.xs,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  inputText: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.text,
    fontWeight: '500',
  },
  placeholderText: {
    color: GoTheme.colors.textTertiary,
  },
  searchButton: {
    padding: GoTheme.spacing.sm,
    borderRadius: GoTheme.borderRadius.md,
    backgroundColor: GoTheme.colors.background,
  },
  searchIcon: {
    fontSize: 18,
    color: GoTheme.colors.textSecondary,
  },

  // ボタン
  buttonContainer: {
    marginTop: 20,
  },
  nextButton: {
    backgroundColor: GoTheme.colors.primary, // #1B2951 濃紺背景
    borderRadius: GoTheme.borderRadius.lg,
    paddingVertical: GoTheme.spacing.lg,
    paddingHorizontal: GoTheme.spacing.xl,
    minHeight: GoTheme.go.buttonHeight.large,
    justifyContent: 'center',
    ...GoTheme.shadows.pill,
  },
  nextButtonText: {
    ...GoTheme.typography.button,
    color: GoTheme.colors.textOnPrimary,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default QuickBookingTab;