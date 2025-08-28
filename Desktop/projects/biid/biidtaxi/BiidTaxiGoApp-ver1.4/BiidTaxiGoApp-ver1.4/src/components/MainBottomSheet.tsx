import React, {useRef, useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  ViewStyle,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {GoTheme} from '../theme/GoTheme';
import {useTheme} from '../contexts/ThemeContext';

const {height: screenHeight} = Dimensions.get('window');

export interface MainBottomSheetProps {
  // 3つの状態
  initialState?: BottomSheetState;
  onStateChange?: (state: BottomSheetState) => void;
  
  // 乗車地情報
  currentLocation?: string;
  onEditLocation?: () => void;
  
  // 目的地検索
  destination?: string;
  onDestinationChange?: (destination: string) => void;
  onDestinationSubmit?: () => void;
  
  // 最近の目的地
  recentDestinations?: string[];
  onRecentDestinationPress?: (destination: string) => void;
  
  // メインアクション
  onCallNow?: () => void;
  isLoading?: boolean;
  
  // スタイル
  style?: ViewStyle;
}

export type BottomSheetState = 'collapsed' | 'half' | 'full';

export const MainBottomSheet: React.FC<MainBottomSheetProps> = ({
  initialState = 'collapsed',
  onStateChange,
  currentLocation = '現在地',
  onEditLocation = () => {},
  destination = '',
  onDestinationChange = () => {},
  onDestinationSubmit = () => {},
  recentDestinations = ['東京駅', '羽田空港', '新宿駅', '渋谷駅'],
  onRecentDestinationPress = () => {},
  onCallNow = () => {},
  isLoading = false,
  style,
}) => {
  const {currentMode, getAccentColor} = useTheme();
  const insets = useSafeAreaInsets();
  
  // 状態管理
  const [currentState, setCurrentState] = useState<BottomSheetState>(initialState);
  const translateY = useRef(new Animated.Value(getInitialPosition(initialState))).current;
  
  // 各状態の高さ計算 - GO spec: Collapsed ~90px
  const collapsedHeight = 90;
  const halfHeight = screenHeight * 0.4;
  const fullHeight = screenHeight * 0.85;
  
  function getInitialPosition(state: BottomSheetState): number {
    switch (state) {
      case 'collapsed':
        return screenHeight - collapsedHeight - insets.bottom;
      case 'half':
        return screenHeight - halfHeight - insets.bottom;
      case 'full':
        return screenHeight - fullHeight - insets.bottom;
      default:
        return screenHeight - collapsedHeight - insets.bottom;
    }
  }
  
  const animateToState = useCallback((state: BottomSheetState) => {
    const position = getInitialPosition(state);
    
    Animated.spring(translateY, {
      toValue: position,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start(() => {
      setCurrentState(state);
      onStateChange?.(state);
    });
  }, [translateY, insets.bottom, onStateChange]);

  // ジェスチャーロック状態
  const [isGestureLocked, setIsGestureLocked] = useState<boolean>(false);
  
  // PanResponder設定（ジェスチャーロック機能付き）
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // ジェスチャーがロックされている場合は反応しない
        if (isGestureLocked) return false;
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderGrant: () => {
        // ドラッグ開始時にジェスチャーをロック
        setIsGestureLocked(true);
      },
      onPanResponderMove: (_, gestureState) => {
        const currentPosition = getInitialPosition(currentState);
        const newPosition = currentPosition + gestureState.dy;
        
        // 範囲制限
        const minPosition = getInitialPosition('full');
        const maxPosition = getInitialPosition('collapsed');
        
        if (newPosition >= minPosition && newPosition <= maxPosition) {
          translateY.setValue(newPosition);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const {dy, vy} = gestureState;
        let targetState: BottomSheetState = currentState;
        
        // スワイプの速度と距離に基づいて状態を決定
        if (Math.abs(vy) > 0.5) {
          // 高速スワイプ
          if (vy > 0) {
            targetState = currentState === 'full' ? 'half' : 'collapsed';
          } else {
            targetState = currentState === 'collapsed' ? 'half' : 'full';
          }
        } else {
          // 通常のドラッグ
          if (dy > 50) {
            targetState = currentState === 'full' ? 'half' : 'collapsed';
          } else if (dy < -50) {
            targetState = currentState === 'collapsed' ? 'half' : 'full';
          }
        }
        
        animateToState(targetState);
        
        // アニメーション完了後にジェスチャーロックを解除（少し遅延）
        setTimeout(() => {
          setIsGestureLocked(false);
        }, 300);
      },
      onPanResponderTerminate: () => {
        // 予期せぬ終了時もジェスチャーロックを解除
        setTimeout(() => {
          setIsGestureLocked(false);
        }, 100);
      },
    })
  ).current;

  // 初期状態の設定
  useEffect(() => {
    animateToState(initialState);
  }, [initialState, animateToState]);

  const renderCollapsedContent = () => (
    <View style={styles.collapsedContent}>
      <TouchableOpacity
        style={[styles.callNowButton, {backgroundColor: getAccentColor()}]}
        onPress={onCallNow}
        disabled={isLoading}
        activeOpacity={0.8}>
        <Text style={styles.callNowButtonText}>
          {isLoading ? '呼び出し中...' : `今すぐ${currentMode === 'ship' ? '船舶を' : 'タクシーを'}呼ぶ`}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderHalfContent = () => (
    <View style={styles.halfContent}>
      {/* 乗車地 */}
      <View style={styles.locationSection}>
        <Text style={styles.sectionLabel}>乗車地</Text>
        <TouchableOpacity
          style={styles.currentLocationPill}
          onPress={onEditLocation}
          activeOpacity={0.7}>
          <View style={styles.locationIconContainer}>
            <Text style={styles.locationIcon}>📍</Text>
          </View>
          <Text style={styles.currentLocationText} numberOfLines={1}>
            {currentLocation}
          </Text>
          <Text style={styles.editIcon}>✏️</Text>
        </TouchableOpacity>
      </View>

      {/* 目的地 */}
      <View style={styles.destinationSection}>
        <Text style={styles.sectionLabel}>目的地</Text>
        <View style={styles.destinationInputContainer}>
          <TextInput
            style={styles.destinationInput}
            placeholder="目的地を検索"
            placeholderTextColor={GoTheme.colors.textSecondary}
            value={destination}
            onChangeText={onDestinationChange}
            onSubmitEditing={onDestinationSubmit}
            returnKeyType="search"
          />
        </View>
        
        <TouchableOpacity
          style={[styles.nextButton, styles.goStyleNextButton]}
          onPress={onDestinationSubmit}
          activeOpacity={0.8}>
          <Text style={styles.nextButtonText}>次へすすむ</Text>
        </TouchableOpacity>
      </View>

      {/* 人気の目的地（GO-style suggestion tags） */}
      <View style={styles.recentSection}>
        <Text style={styles.sectionLabel}>人気の目的地</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.recentScrollView}>
          {/* Popular GO-style suggestion tags */}
          {['グランフロント大阪', '大阪駅', '梅田', '難波', '心斎橋', '天王寺'].map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.recentChip, index === 0 && styles.popularChip]}
              onPress={() => onRecentDestinationPress(item)}
              activeOpacity={0.7}>
              <Text style={[styles.recentChipText, index === 0 && styles.popularChipText]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderFullContent = () => (
    <View style={styles.fullContent}>
      {renderHalfContent()}
      
      {/* 候補リスト */}
      <View style={styles.candidatesSection}>
        <Text style={styles.sectionLabel}>候補リスト</Text>
        <ScrollView style={styles.candidatesList}>
          {/* 仮の候補データ */}
          {['東京駅（丸の内南口）', '東京駅（八重洲口）', '東京駅（日本橋口）'].map((candidate, index) => (
            <TouchableOpacity
              key={index}
              style={styles.candidateItem}
              onPress={() => onRecentDestinationPress(candidate)}
              activeOpacity={0.7}>
              <View style={styles.candidateIconContainer}>
                <Text style={styles.candidateIcon}>🏢</Text>
              </View>
              <View style={styles.candidateTextContainer}>
                <Text style={styles.candidateMainText}>{candidate}</Text>
                <Text style={styles.candidateSubText}>約5分 • 1.2km</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 見積カード */}
      <View style={styles.estimateCard}>
        <View style={styles.estimateHeader}>
          <Text style={styles.estimateTitle}>料金見積</Text>
          <Text style={[styles.estimatePrice, {color: getAccentColor()}]}>¥800 - ¥1,200</Text>
        </View>
        <Text style={styles.estimateSubtext}>
          {currentMode === 'ship' ? '船舶料金' : 'タクシー料金'}・所要時間約8分
        </Text>
      </View>

      {/* 利用規約リンク */}
      <TouchableOpacity style={styles.termsLink} activeOpacity={0.7}>
        <Text style={styles.termsText}>利用規約とプライバシーポリシー</Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    switch (currentState) {
      case 'collapsed':
        return renderCollapsedContent();
      case 'half':
        return renderHalfContent();
      case 'full':
        return renderFullContent();
      default:
        return renderCollapsedContent();
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{translateY}],
          paddingBottom: insets.bottom,
        },
        style,
      ]}
      {...panResponder.panHandlers}>
      
      {/* ドラッグハンドル */}
      <View style={styles.handle} />
      
      {/* コンテンツ */}
      <View style={styles.content}>
        {renderContent()}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // GO-style semi-transparent white
    borderTopLeftRadius: 20, // GO-style smaller radius
    borderTopRightRadius: 20,
    ...GoTheme.shadows.large,
    zIndex: 100,
    backdropFilter: 'blur(10px)', // GO-style blur effect (iOS only)
  },
  handle: {
    width: 36, // GO-style slightly smaller
    height: 4,
    backgroundColor: '#E2E8F0', // GO-style lighter handle color
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
    opacity: 0.6,
  },
  content: {
    paddingHorizontal: GoTheme.spacing.lg,
  },

  // 折畳時コンテンツ
  collapsedContent: {
    paddingBottom: GoTheme.spacing.lg,
  },
  callNowButton: {
    borderRadius: 16,
    paddingVertical: GoTheme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...GoTheme.shadows.medium,
  },
  callNowButtonText: {
    ...GoTheme.typography.button,
    color: GoTheme.colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },

  // 半展開時コンテンツ
  halfContent: {
    paddingBottom: GoTheme.spacing.lg,
  },
  locationSection: {
    marginBottom: GoTheme.spacing.lg,
  },
  sectionLabel: {
    ...GoTheme.typography.caption,
    color: GoTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: GoTheme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  currentLocationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 250, 252, 0.8)', // GO-style semi-transparent
    borderRadius: 12,
    paddingVertical: GoTheme.spacing.sm,
    paddingHorizontal: GoTheme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)', // GO-style lighter border
  },
  locationIconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: GoTheme.spacing.sm,
  },
  locationIcon: {
    fontSize: 16,
  },
  currentLocationText: {
    ...GoTheme.typography.body,
    flex: 1,
    color: GoTheme.colors.text,
    fontWeight: '600',
  },
  editIcon: {
    fontSize: 14,
    marginLeft: GoTheme.spacing.sm,
  },

  destinationSection: {
    marginBottom: GoTheme.spacing.lg,
  },
  destinationInputContainer: {
    marginBottom: GoTheme.spacing.md,
  },
  destinationInput: {
    ...GoTheme.typography.body,
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // GO-style semi-transparent
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)', // GO-style lighter border
    borderRadius: 12,
    paddingVertical: GoTheme.spacing.md,
    paddingHorizontal: GoTheme.spacing.md,
    fontSize: 16,
    color: GoTheme.colors.text,
  },
  nextButton: {
    borderRadius: 12,
    paddingVertical: GoTheme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // GO-style navy button
  goStyleNextButton: {
    backgroundColor: '#003366', // GO-style dark navy
    borderRadius: 16, // GO-style larger radius
    paddingVertical: 14, // Slightly larger padding
    shadowColor: '#003366',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  nextButtonText: {
    ...GoTheme.typography.button,
    color: GoTheme.colors.white,
    fontWeight: '600',
    fontSize: 15, // Slightly larger font
  },

  recentSection: {
    marginBottom: GoTheme.spacing.lg,
  },
  recentScrollView: {
    flexGrow: 0,
  },
  recentChip: {
    backgroundColor: 'rgba(241, 245, 249, 0.8)', // GO-style semi-transparent
    paddingVertical: GoTheme.spacing.xs,
    paddingHorizontal: GoTheme.spacing.sm,
    borderRadius: 16, // GO-style slightly smaller radius
    marginRight: GoTheme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)', // GO-style lighter border
  },
  recentChipText: {
    ...GoTheme.typography.caption,
    color: GoTheme.colors.text,
    fontSize: 12,
    fontWeight: '500',
  },
  // GO-style popular chip (first item)
  popularChip: {
    backgroundColor: 'rgba(0, 82, 164, 0.1)', // GO primary blue tint
    borderColor: 'rgba(0, 82, 164, 0.2)',
  },
  popularChipText: {
    color: '#0052A4', // GO primary blue
    fontWeight: '600',
  },

  // 全展開時追加コンテンツ
  fullContent: {
    paddingBottom: GoTheme.spacing.lg,
  },
  candidatesSection: {
    marginBottom: GoTheme.spacing.lg,
  },
  candidatesList: {
    maxHeight: 200,
  },
  candidateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: GoTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: GoTheme.colors.border,
  },
  candidateIconContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: GoTheme.spacing.sm,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
  },
  candidateIcon: {
    fontSize: 16,
  },
  candidateTextContainer: {
    flex: 1,
  },
  candidateMainText: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  candidateSubText: {
    ...GoTheme.typography.caption,
    color: GoTheme.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },

  estimateCard: {
    backgroundColor: 'rgba(248, 250, 252, 0.8)', // GO-style semi-transparent
    borderRadius: 12,
    padding: GoTheme.spacing.md,
    marginBottom: GoTheme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)', // GO-style lighter border
  },
  estimateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: GoTheme.spacing.xs,
  },
  estimateTitle: {
    ...GoTheme.typography.body,
    color: GoTheme.colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  estimatePrice: {
    ...GoTheme.typography.body,
    fontWeight: 'bold',
    fontSize: 16,
  },
  estimateSubtext: {
    ...GoTheme.typography.caption,
    color: GoTheme.colors.textSecondary,
    fontSize: 12,
  },

  termsLink: {
    alignItems: 'center',
    paddingVertical: GoTheme.spacing.sm,
  },
  termsText: {
    ...GoTheme.typography.caption,
    color: GoTheme.colors.textSecondary,
    fontSize: 11,
    textDecorationLine: 'underline',
  },
});