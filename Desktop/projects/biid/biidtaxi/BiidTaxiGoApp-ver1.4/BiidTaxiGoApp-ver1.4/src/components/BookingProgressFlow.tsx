import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  ActivityIndicator,
  Animated,
} from 'react-native';
import {GoTheme} from '../theme/GoTheme';
import {useTheme} from '../contexts/ThemeContext';

export interface BookingProgressFlowProps {
  // 予約タイプ
  bookingType: 'taxi' | 'ship';
  
  // 現在のステップ
  currentStep: BookingStep;
  
  // 予約データ
  bookingData?: {
    id?: string;
    pickupLocation?: string;
    destinationLocation?: string;
    estimatedTime?: string;
    fare?: number;
    driverName?: string;
    vehicleInfo?: string;
    vesselName?: string;
    departureTime?: string;
  };
  
  // コールバック
  onCancel?: () => void;
  onContactDriver?: () => void;
  onRateService?: (rating: number) => void;
  
  // スタイル
  style?: ViewStyle;
}

export type BookingStep = 
  | 'searching' 
  | 'matched' 
  | 'pickup' 
  | 'enroute' 
  | 'arrived' 
  | 'completed';

interface StepConfig {
  title: string;
  description: string;
  icon: string;
  showCancel?: boolean;
  showContact?: boolean;
  showRating?: boolean;
  autoProgress?: boolean;
}

export const BookingProgressFlow: React.FC<BookingProgressFlowProps> = ({
  bookingType,
  currentStep,
  bookingData,
  onCancel = () => {},
  onContactDriver = () => {},
  onRateService = () => {},
  style,
}) => {
  const {currentMode, getAccentColor} = useTheme();
  const [animationValue] = useState(new Animated.Value(0));
  const [rating, setRating] = useState<number>(0);

  // ステップ設定
  const stepConfigs: Record<BookingStep, StepConfig> = {
    searching: {
      title: `${bookingType === 'ship' ? '船舶' : 'タクシー'}を探しています`,
      description: `最適な${bookingType === 'ship' ? '便' : 'ドライバー'}を検索中です...`,
      icon: '🔍',
      showCancel: true,
      autoProgress: true,
    },
    matched: {
      title: `${bookingType === 'ship' ? '船舶' : 'ドライバー'}が見つかりました！`,
      description: bookingType === 'ship' 
        ? `${bookingData?.vesselName || '船舶'}の予約が確定しました`
        : `${bookingData?.driverName || 'ドライバー'}がお迎えに向かっています`,
      icon: bookingType === 'ship' ? '🚢' : '🚗',
      showCancel: true,
      showContact: bookingType === 'taxi',
    },
    pickup: {
      title: bookingType === 'ship' ? '港でお待ちください' : 'お迎えに向かっています',
      description: bookingType === 'ship' 
        ? `${bookingData?.departureTime || '出発時刻'}の15分前までに港にお越しください`
        : `${bookingData?.estimatedTime || '約5分'}でお迎えに到着予定です`,
      icon: bookingType === 'ship' ? '⚓' : '📍',
      showCancel: true,
      showContact: bookingType === 'taxi',
    },
    enroute: {
      title: bookingType === 'ship' ? '航行中' : '目的地へ向かっています',
      description: bookingType === 'ship'
        ? '安全な航海をお楽しみください'
        : '目的地まで安全運転でお送りします',
      icon: bookingType === 'ship' ? '🌊' : '🛣️',
      showContact: true,
    },
    arrived: {
      title: bookingType === 'ship' ? '到着しました' : '目的地に到着',
      description: bookingType === 'ship'
        ? 'お疲れ様でした。降船の準備をお願いします'
        : '目的地に到着しました。お疲れ様でした',
      icon: bookingType === 'ship' ? '🏖️' : '🎯',
    },
    completed: {
      title: 'ご利用ありがとうございました',
      description: 'サービスの評価をお聞かせください',
      icon: '✅',
      showRating: true,
    },
  };

  const currentConfig = stepConfigs[currentStep];

  // ステップ変更時のアニメーション
  useEffect(() => {
    Animated.sequence([
      Animated.timing(animationValue, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(animationValue, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentStep]);

  // 自動進行ステップの処理
  useEffect(() => {
    if (currentConfig.autoProgress) {
      // 実際の実装では、WebSocketやAPIポーリングでステップ更新を受信
      const timer = setTimeout(() => {
        // onStepChange?.('matched'); // 親コンポーネントで処理
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [currentStep, currentConfig.autoProgress]);

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => {
              setRating(star);
              setTimeout(() => onRateService(star), 500);
            }}
            activeOpacity={0.7}>
            <Text style={[
              styles.star,
              {color: star <= rating ? '#FFD700' : '#E2E8F0'}
            ]}>
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderProgressIndicator = () => {
    const steps: BookingStep[] = ['searching', 'matched', 'pickup', 'enroute', 'arrived', 'completed'];
    const currentIndex = steps.indexOf(currentStep);
    
    return (
      <View style={styles.progressContainer}>
        {steps.map((step, index) => (
          <View key={step} style={styles.progressStep}>
            <View style={[
              styles.progressDot,
              {
                backgroundColor: index <= currentIndex ? getAccentColor() : '#E2E8F0',
              }
            ]} />
            {index < steps.length - 1 && (
              <View style={[
                styles.progressLine,
                {
                  backgroundColor: index < currentIndex ? getAccentColor() : '#E2E8F0',
                }
              ]} />
            )}
          </View>
        ))}
      </View>
    );
  };

  return (
    <Animated.View 
      style={[
        styles.container, 
        style,
        {
          opacity: animationValue,
          transform: [{
            translateY: animationValue.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          }],
        }
      ]}>
      
      {/* プログレス インディケーター */}
      {renderProgressIndicator()}
      
      {/* メインコンテンツ */}
      <View style={styles.content}>
        
        {/* アイコン */}
        <View style={styles.iconContainer}>
          <Text style={styles.stepIcon}>{currentConfig.icon}</Text>
          {currentConfig.autoProgress && (
            <ActivityIndicator 
              size="small" 
              color={getAccentColor()} 
              style={styles.loadingIndicator}
            />
          )}
        </View>
        
        {/* タイトル・説明 */}
        <Text style={styles.title}>{currentConfig.title}</Text>
        <Text style={styles.description}>{currentConfig.description}</Text>
        
        {/* 予約詳細 */}
        {bookingData && (
          <View style={styles.detailsContainer}>
            {bookingData.pickupLocation && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>乗車地:</Text>
                <Text style={styles.detailValue}>{bookingData.pickupLocation}</Text>
              </View>
            )}
            
            {bookingData.destinationLocation && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>目的地:</Text>
                <Text style={styles.detailValue}>{bookingData.destinationLocation}</Text>
              </View>
            )}
            
            {bookingData.fare && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>料金:</Text>
                <Text style={[styles.detailValue, styles.fareValue]}>
                  ¥{bookingData.fare.toLocaleString()}
                </Text>
              </View>
            )}
            
            {bookingData.driverName && bookingType === 'taxi' && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>ドライバー:</Text>
                <Text style={styles.detailValue}>{bookingData.driverName}</Text>
              </View>
            )}
            
            {bookingData.vehicleInfo && bookingType === 'taxi' && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>車両:</Text>
                <Text style={styles.detailValue}>{bookingData.vehicleInfo}</Text>
              </View>
            )}
            
            {bookingData.vesselName && bookingType === 'ship' && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>船舶:</Text>
                <Text style={styles.detailValue}>{bookingData.vesselName}</Text>
              </View>
            )}
            
            {bookingData.departureTime && bookingType === 'ship' && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>出発:</Text>
                <Text style={styles.detailValue}>{bookingData.departureTime}</Text>
              </View>
            )}
          </View>
        )}
        
        {/* 評価 */}
        {currentConfig.showRating && (
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingLabel}>サービスの評価</Text>
            {renderStars()}
            {rating > 0 && (
              <Text style={styles.ratingThank}>評価いただき、ありがとうございました！</Text>
            )}
          </View>
        )}
        
        {/* アクションボタン */}
        <View style={styles.actionContainer}>
          
          {currentConfig.showContact && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.contactButton]}
              onPress={onContactDriver}
              activeOpacity={0.8}>
              <Text style={styles.contactButtonText}>
                {bookingType === 'ship' ? '船舶に連絡' : 'ドライバーに連絡'}
              </Text>
            </TouchableOpacity>
          )}
          
          {currentConfig.showCancel && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.cancelButton]}
              onPress={onCancel}
              activeOpacity={0.8}>
              <Text style={styles.cancelButtonText}>キャンセル</Text>
            </TouchableOpacity>
          )}
        </View>
        
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: GoTheme.colors.surface,
    borderRadius: GoTheme.borderRadius.xl,
    padding: GoTheme.spacing.lg,
    margin: GoTheme.spacing.md,
    ...GoTheme.shadows.sheet,
    borderWidth: 1,
    borderColor: GoTheme.colors.border,
  },
  
  // プログレス インディケーター
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: GoTheme.spacing.lg,
  },
  
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  
  progressLine: {
    width: 24,
    height: 2,
    marginHorizontal: 4,
  },
  
  // メインコンテンツ
  content: {
    alignItems: 'center',
  },
  
  iconContainer: {
    position: 'relative',
    marginBottom: GoTheme.spacing.md,
  },
  
  stepIcon: {
    fontSize: 48,
    textAlign: 'center',
  },
  
  loadingIndicator: {
    position: 'absolute',
    bottom: -8,
    right: -8,
  },
  
  title: {
    ...GoTheme.typography.h3,
    fontSize: 20,
    fontWeight: '700',
    color: GoTheme.colors.text,
    textAlign: 'center',
    marginBottom: GoTheme.spacing.sm,
  },
  
  description: {
    ...GoTheme.typography.body,
    fontSize: 14,
    color: GoTheme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: GoTheme.spacing.lg,
    lineHeight: 20,
  },
  
  // 詳細情報
  detailsContainer: {
    width: '100%',
    backgroundColor: GoTheme.colors.background,
    borderRadius: GoTheme.borderRadius.lg,
    padding: GoTheme.spacing.md,
    marginBottom: GoTheme.spacing.lg,
    borderWidth: 1,
    borderColor: GoTheme.colors.border,
    ...GoTheme.shadows.small,
  },
  
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: GoTheme.spacing.xs,
  },
  
  detailLabel: {
    ...GoTheme.typography.body,
    fontSize: 13,
    color: GoTheme.colors.textSecondary,
    fontWeight: '500',
  },
  
  detailValue: {
    ...GoTheme.typography.body,
    fontSize: 13,
    color: GoTheme.colors.text,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  
  fareValue: {
    color: GoTheme.colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  
  // 評価
  ratingContainer: {
    alignItems: 'center',
    marginBottom: GoTheme.spacing.lg,
  },
  
  ratingLabel: {
    ...GoTheme.typography.body,
    fontSize: 14,
    color: GoTheme.colors.text,
    fontWeight: '600',
    marginBottom: GoTheme.spacing.sm,
  },
  
  starsContainer: {
    flexDirection: 'row',
    marginBottom: GoTheme.spacing.sm,
  },
  
  star: {
    fontSize: 32,
    marginHorizontal: GoTheme.spacing.xs,
  },
  
  ratingThank: {
    ...GoTheme.typography.caption,
    fontSize: 12,
    color: GoTheme.colors.primary,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  
  // アクションボタン
  actionContainer: {
    width: '100%',
    gap: GoTheme.spacing.sm,
  },
  
  actionButton: {
    borderRadius: GoTheme.borderRadius.lg,
    paddingVertical: GoTheme.spacing.lg,
    paddingHorizontal: GoTheme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: GoTheme.go.buttonHeight.large,
    ...GoTheme.shadows.pill,
  },
  
  contactButton: {
    backgroundColor: GoTheme.colors.primary,
  },
  
  contactButtonText: {
    ...GoTheme.typography.button,
    color: GoTheme.colors.textOnPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: GoTheme.colors.error,
  },
  
  cancelButtonText: {
    ...GoTheme.typography.button,
    color: GoTheme.colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
});