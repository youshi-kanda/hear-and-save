import React, {useRef, useEffect} from 'react';
import {
  View,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';

export interface CenterMapMarkerProps {
  // 位置精度
  accuracyRadius?: number; // メートル単位
  showAccuracyCircle?: boolean;
  
  // アニメーション
  bounceOnUpdate?: boolean;
  
  // スタイル
  style?: ViewStyle;
}

export const CenterMapMarker: React.FC<CenterMapMarkerProps> = ({
  accuracyRadius = 50,
  showAccuracyCircle = true,
  bounceOnUpdate = true,
  style,
}) => {
  // アニメーション値
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // バウンスアニメーション
  const triggerBounce = () => {
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: 0.8,
        duration: 70,
        useNativeDriver: true,
      }),
      Animated.spring(bounceAnim, {
        toValue: 1,
        tension: 150,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // 位置精度サークルのパルスアニメーション
  useEffect(() => {
    if (showAccuracyCircle) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      
      return () => pulse.stop();
    }
  }, [showAccuracyCircle, pulseAnim]);

  // GO仕様: ドラッグ終了時140msバウンスアニメーション
  const triggerDragEndBounce = () => {
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: 0.9,
        duration: 70, // 140ms total / 2
        useNativeDriver: true,
      }),
      Animated.spring(bounceAnim, {
        toValue: 1,
        tension: 180, // より強いバウンス
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // 位置更新時のバウンス
  useEffect(() => {
    if (bounceOnUpdate) {
      triggerDragEndBounce(); // GO仕様のバウンスを使用
    }
  }, [accuracyRadius, bounceOnUpdate]);

  // 精度円のサイズ計算（簡易版）
  const getCircleSize = () => {
    // 実際の実装では地図のズームレベルと精度半径から計算
    // ここでは簡易的に40-120pxの範囲でマッピング
    const minSize = 40;
    const maxSize = 120;
    const normalizedRadius = Math.min(Math.max(accuracyRadius, 10), 200);
    return minSize + ((normalizedRadius - 10) / 190) * (maxSize - minSize);
  };

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      
      {/* 位置精度サークル */}
      {showAccuracyCircle && (
        <Animated.View
          style={[
            styles.accuracyCircle,
            {
              width: getCircleSize(),
              height: getCircleSize(),
              transform: [{scale: pulseAnim}],
            },
          ]}
        />
      )}
      
      {/* メインピン */}
      <Animated.View
        style={[
          styles.pinContainer,
          {
            transform: [
              {scale: Animated.multiply(bounceAnim, scaleAnim)},
            ],
          },
        ]}>
        
        {/* 外輪（濃紺） */}
        <View style={styles.pinOuter}>
          {/* 内芯（白） */}
          <View style={styles.pinInner} />
        </View>
        
        {/* ピンの影 */}
        <View style={styles.pinShadow} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    // 画面中央に配置（親コンテナで位置調整）
    zIndex: 100,
  },
  
  // 位置精度サークル
  accuracyCircle: {
    position: 'absolute',
    borderRadius: 1000, // 完全な円
    backgroundColor: 'rgba(59, 167, 255, 0.24)', // #3BA7FF 24%
    borderWidth: 1,
    borderColor: 'rgba(59, 167, 255, 0.4)',
    zIndex: 1,
  },
  
  // ピンコンテナ
  pinContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  
  // ピン外輪（濃紺）
  pinOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0A3A67', // 濃紺
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  
  // ピン内芯（白）
  pinInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  
  // ピンの影
  pinShadow: {
    position: 'absolute',
    top: 18,
    width: 16,
    height: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    transform: [{scaleX: 1.2}],
    zIndex: -1,
  },
});