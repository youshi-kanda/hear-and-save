import React, {useState, useRef, useEffect, useImperativeHandle, forwardRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {GoTheme} from '../theme/GoTheme';

// Gesture Handlerのインポートを安全にする
let PanGestureHandler: any, PanGestureHandlerGestureEvent: any;
try {
  const gestureHandler = require('react-native-gesture-handler');
  PanGestureHandler = gestureHandler.PanGestureHandler;
  PanGestureHandlerGestureEvent = gestureHandler.PanGestureHandlerGestureEvent;
} catch (error) {
  console.warn('Gesture handler not available, using fallback', error);
}

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

// GO仕様: 3段階の高さ設定
const COLLAPSED_HEIGHT = 90; // 縮小: 90dp
const HALF_HEIGHT_PERCENT = 0.58; // 半開: 55-60%（58%設定）
const FULL_HEIGHT_PERCENT = 0.92; // 全開: 92%

export type BottomSheetState = 'collapsed' | 'half' | 'full';

export type GoThreeStageBottomSheetRef = {
  handleMapTap: () => void; // GO仕様: 地図タップ時の処理
  animateToState: (state: BottomSheetState) => void;
  snapTo: (state: BottomSheetState) => void; // 標準的なメソッド名
  expand: () => void;
  collapse: () => void;
};

type GoThreeStageBottomSheetProps = {
  children?: React.ReactNode;
  initialState?: BottomSheetState;
  onStateChange?: (state: BottomSheetState) => void;
  onMapInteractionShouldLock?: (lock: boolean) => void; // マップ操作ロック制御
};

const GoThreeStageBottomSheet = forwardRef<GoThreeStageBottomSheetRef, GoThreeStageBottomSheetProps>(({
  children,
  initialState = 'half',
  onStateChange,
  onMapInteractionShouldLock,
}, ref) => {
  const insets = useSafeAreaInsets();
  const [currentState, setCurrentState] = useState<BottomSheetState>(initialState);
  const translateY = useRef(new Animated.Value(0)).current;
  const gestureRef = useRef<any>(null);
  
  // GO仕様: アニメーション制御（クラッシュ防止）
  const lastGestureEnd = useRef<number>(0);
  const currentAnimation = useRef<Animated.CompositeAnimation | null>(null);
  
  // 各状態の高さ計算
  const getStateHeight = (state: BottomSheetState): number => {
    switch (state) {
      case 'collapsed':
        return COLLAPSED_HEIGHT;
      case 'half':
        return SCREEN_HEIGHT * HALF_HEIGHT_PERCENT;
      case 'full':
        return SCREEN_HEIGHT * FULL_HEIGHT_PERCENT;
      default:
        return SCREEN_HEIGHT * HALF_HEIGHT_PERCENT;
    }
  };
  
  // 現在の状態から translateY 値を計算
  const getTranslateY = (state: BottomSheetState): number => {
    const stateHeight = getStateHeight(state);
    return SCREEN_HEIGHT - stateHeight - insets.bottom;
  };

  // GO仕様: 状態変更アニメーション（最適化・カスタムイージング）
  const animateToState = (newState: BottomSheetState) => {
    const targetY = getTranslateY(newState);
    const currentHeight = getStateHeight(currentState);
    const newHeight = getStateHeight(newState);
    
    // GO仕様: 開閉方向に基づいてイージングを選択
    const isExpanding = newHeight > currentHeight;
    const easing = isExpanding 
      ? Easing.out(Easing.cubic) // 展開時: easeOutCubic
      : Easing.in(Easing.cubic);  // 収縮時: easeInCubic
    
    // GO仕様: よりスムーズなアニメーション設定
    const distance = Math.abs(targetY - (translateY as any)._value);
    const baseDuration = 350; // ベースデュレーションを長く
    const maxDuration = 500;  // 最大デュレーションを長く
    const duration = Math.min(baseDuration + (distance * 0.3), maxDuration);
    
    Animated.timing(translateY, {
      toValue: targetY,
      duration,
      easing,
      useNativeDriver: true,
    }).start((finished) => {
      if (finished) {
        setCurrentState(newState);
        onStateChange?.(newState);
      }
    });
  };

  // GO仕様: 地図タップ時の処理を外部から呼び出し可能にする
  const handleMapTap = () => {
    if (currentState === 'half') {
      animateToState('collapsed');
    }
  };

  // ref経由で外部からメソッド呼び出し可能にする
  useImperativeHandle(ref, () => ({
    handleMapTap,
    animateToState,
    snapTo: animateToState, // エイリアス
    expand: () => animateToState('full'),
    collapse: () => animateToState('collapsed'),
  }));

  // 初期位置設定
  useEffect(() => {
    const initialY = getTranslateY(initialState);
    translateY.setValue(initialY);
    setCurrentState(initialState);
  }, []);

  // GO仕様: ジェスチャー処理（パフォーマンス最適化）
  const onGestureEvent = Animated.event(
    [{nativeEvent: {translationY: translateY}}],
    {
      useNativeDriver: true,
      listener: (event: any) => {
        // GO仕様: ドラッグ中はマップ操作をロック（デバウンス）
        onMapInteractionShouldLock?.(true);
      },
    }
  );

  const onGestureEnd = (event: any) => {
    const now = Date.now();
    
    // GO仕様: デバウンス処理（120ms以内の再入を無視）
    if (now - lastGestureEnd.current < 120) {
      return;
    }
    lastGestureEnd.current = now;
    
    const {translationY: gestureY, velocityY} = event.nativeEvent;
    
    // GO仕様: ドラッグ終了時にマップ操作ロックを解除
    onMapInteractionShouldLock?.(false);
    
    // NaN/undefined チェック
    if (!Number.isFinite(gestureY) || !Number.isFinite(velocityY)) {
      console.warn('GoThreeStageBottomSheet: Invalid gesture values detected');
      return;
    }
    
    // 現在の位置から最も近い状態を決定
    const currentY = getTranslateY(currentState) + gestureY;
    const collapsedY = getTranslateY('collapsed');
    const halfY = getTranslateY('half');
    const fullY = getTranslateY('full');
    
    let targetState: BottomSheetState;
    
    // GO仕様: より操作しやすい速度設定
    const absVelocity = Math.abs(velocityY);
    const velocityThreshold = 800; // 速度閾値を上げて、より大きなスワイプが必要に
    
    // 極小速度の場合は位置ベース判定のみ（範囲を拡大）
    if (absVelocity < 100) {
      // 位置ベースの判定（精度向上）
      const distanceToCollapsed = Math.abs(currentY - collapsedY);
      const distanceToHalf = Math.abs(currentY - halfY);
      const distanceToFull = Math.abs(currentY - fullY);
      
      const minDistance = Math.min(distanceToCollapsed, distanceToHalf, distanceToFull);
      
      if (minDistance === distanceToCollapsed) {
        targetState = 'collapsed';
      } else if (minDistance === distanceToFull) {
        targetState = 'full';
      } else {
        targetState = 'half';
      }
    } else if (absVelocity > velocityThreshold) {
      if (velocityY > 0) {
        // 下向きスワイプ（収縮方向）
        targetState = currentState === 'full' ? 'half' : 'collapsed';
      } else {
        // 上向きスワイプ（展開方向）
        targetState = currentState === 'collapsed' ? 'half' : 'full';
      }
    } else {
      // 中程度の速度：位置ベース判定
      const distanceToCollapsed = Math.abs(currentY - collapsedY);
      const distanceToHalf = Math.abs(currentY - halfY);
      const distanceToFull = Math.abs(currentY - fullY);
      
      const minDistance = Math.min(distanceToCollapsed, distanceToHalf, distanceToFull);
      
      if (minDistance === distanceToCollapsed) {
        targetState = 'collapsed';
      } else if (minDistance === distanceToFull) {
        targetState = 'full';
      } else {
        targetState = 'half';
      }
    }
    
    // GO仕様: 速度に基づく動的アニメーション（安全計算）
    animateToStateWithVelocity(targetState, absVelocity);
  };

  // GO仕様: 速度考慮アニメーション（クラッシュ防止・安全計算）
  const animateToStateWithVelocity = (newState: BottomSheetState, velocity: number) => {
    // 同一状態への無駄なアニメーションを防ぐ
    if (newState === currentState) {
      return;
    }
    
    const targetY = getTranslateY(newState);
    const currentY = (translateY as any)._value || getTranslateY(currentState);
    const distance = Math.abs(targetY - currentY);
    
    // ゼロ距離または極小距離の場合は即座に設定
    if (distance < 1) {
      translateY.setValue(targetY);
      setCurrentState(newState);
      onStateChange?.(newState);
      return;
    }
    
    // 進行中のアニメーションを停止
    if (currentAnimation.current) {
      currentAnimation.current.stop();
      currentAnimation.current = null;
    }
    
    const currentHeight = getStateHeight(currentState);
    const newHeight = getStateHeight(newState);
    
    // 開閉方向とイージング
    const isExpanding = newHeight > currentHeight;
    const easing = isExpanding 
      ? Easing.out(Easing.cubic) 
      : Easing.in(Easing.cubic);
    
    // GO仕様: よりスムーズなアニメーション計算
    // 速度の下限設定（px/s → px/ms変換）
    const MIN_VELOCITY_PX_S = 400; // 最小速度を下げる
    const MAX_VELOCITY_PX_S = 2000; // 最大速度を下げる
    const safeVelocity = Math.max(MIN_VELOCITY_PX_S, Math.min(velocity, MAX_VELOCITY_PX_S));
    const velocityMs = safeVelocity / 1000; // px/ms に変換
    
    // 距離ベース + 速度補正のデュレーション計算（より長めに）
    const baseDuration = 400; // ベースを長く
    let duration = Math.max(distance / velocityMs * 0.8, baseDuration * 0.8); // より長い計算
    
    // GO仕様: 安全範囲にクランプ（250ms-650ms）より長い範囲
    duration = Math.max(250, Math.min(duration, 650));
    
    // NaN/Infinityチェック
    if (!Number.isFinite(duration) || !Number.isFinite(targetY)) {
      console.warn('GoThreeStageBottomSheet: Invalid animation values detected, using fallback');
      duration = 250;
    }
    
    // デバッグログ
    if (__DEV__) {
      console.log(`BottomSheet Animation: ${currentState} → ${newState}, distance: ${distance.toFixed(1)}px, velocity: ${velocity.toFixed(1)}px/s, duration: ${duration.toFixed(0)}ms`);
    }
    
    currentAnimation.current = Animated.timing(translateY, {
      toValue: targetY,
      duration,
      easing,
      useNativeDriver: true,
    });
    
    currentAnimation.current.start((finished) => {
      currentAnimation.current = null;
      if (finished) {
        setCurrentState(newState);
        onStateChange?.(newState);
      }
    });
  };

  // Gesture Handlerが利用可能かチェック
  if (PanGestureHandler) {
    return (
      <View style={styles.container}>
        <PanGestureHandler
          ref={gestureRef}
          onGestureEvent={onGestureEvent}
          onEnded={onGestureEnd}
          activeOffsetY={[-15, 15]} // より大きな操作が必要に
          failOffsetX={[-30, 30]} // 横方向の誤操作を減らす
          shouldCancelWhenOutside={false}
          avgTouches={true}
          enableTrackpadTwoFingerGesture={false}
          minPointers={1}
          maxPointers={1}>
          
          <Animated.View
            style={[
              styles.sheet,
              {
                height: SCREEN_HEIGHT,
                transform: [{translateY}],
              },
            ]}>
            
            {/* GO仕様: グラブハンドル */}
            <View style={styles.grabHandle} />
            
            {/* GO仕様: コンテンツエリア（全状態対応） */}
            <View style={styles.content} removeClippedSubviews={true}>
              {children || (
                <View style={styles.fallbackContent}>
                  <Text style={styles.fallbackText}>Loading...</Text>
                </View>
              )}
            </View>
          </Animated.View>
        </PanGestureHandler>
      </View>
    );
  }

  // フォールバック: Gesture Handler無しの基本表示
  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.sheet,
          {
            height: getStateHeight(currentState) + insets.bottom,
          },
        ]}>
        
        {/* GO仕様: グラブハンドル */}
        <View style={styles.grabHandle} />
        
        {/* GO仕様: コンテンツエリア（全状態対応） */}
        <View style={styles.content}>
          {children || (
            <View style={styles.fallbackContent}>
              <Text style={styles.fallbackText}>Loading...</Text>
            </View>
          )}
        </View>
        
        {/* フォールバック表示用のデバッグ情報 */}
        <View style={styles.fallbackInfo}>
          <Text style={styles.fallbackInfoText}>Simple Mode (No Gestures)</Text>
        </View>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
    zIndex: 1000, // 最前面（マップ要素より上位）
  },
  
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    // GO仕様: elevation 12 (シート用影設定)
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 12,
  },
  
  // GO仕様: グラブハンドル（標準化済み）
  grabHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#C1C9D2',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: GoTheme.spacing.sm + 4, // 12 -> 標準化
    marginBottom: GoTheme.spacing.md, // 16 -> 統一
  },
  
  content: {
    flex: 1,
    paddingHorizontal: GoTheme.spacing.md, // 16 -> 統一
  },
  
  // 縮小時のコンテンツ（標準化済み）
  collapsedContent: {
    height: GoTheme.spacing.lg - 4, // 20 -> 標準化
  },
  
  // フォールバックコンテンツ（エラー時表示）
  fallbackContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  
  fallbackText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  
  // フォールバック情報表示
  fallbackInfo: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 6,
    borderRadius: 4,
  },
  
  fallbackInfoText: {
    fontSize: 10,
    color: '#FFFFFF',
  },
});

// displayName を設定（デバッグ時に便利）
GoThreeStageBottomSheet.displayName = 'GoThreeStageBottomSheet';

export default GoThreeStageBottomSheet;