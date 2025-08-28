import React, {useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ViewStyle,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {GoTheme} from '../theme/GoTheme';
import {useTheme} from '../contexts/ThemeContext';

export interface CurrentLocationFABProps {
  // 現在地取得コールバック
  onPress?: () => void;
  
  // 位置情報
  currentLocation?: {latitude: number; longitude: number};
  isLocationLoading?: boolean;
  
  // 表示設定
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'small' | 'medium' | 'large';
  
  // アニメーション設定
  animationDuration?: number; // デフォルト 600ms
  
  // スタイル
  style?: ViewStyle;
}

/**
 * CurrentLocationFAB: GO仕様の現在地FABボタン
 * 600msスムーズアニメーションで地図を現在地に移動
 */
export const CurrentLocationFAB: React.FC<CurrentLocationFABProps> = ({
  onPress = () => {},
  currentLocation,
  isLocationLoading = false,
  position = 'bottom-right',
  size = 'medium',
  animationDuration = 600,
  style,
}) => {
  const {getAccentColor} = useTheme();
  const insets = useSafeAreaInsets();
  
  // アニメーション値
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // 押下状態
  const [isPressed, setIsPressed] = useState(false);

  // サイズ設定
  const getSizeDimensions = () => {
    switch (size) {
      case 'small':
        return {width: 44, height: 44, iconSize: 16};
      case 'large':
        return {width: 64, height: 64, iconSize: 24};
      case 'medium':
      default:
        return {width: 56, height: 56, iconSize: 20};
    }
  };

  // 位置設定
  const getPositionStyle = () => {
    const offset = GoTheme.spacing.md;
    
    switch (position) {
      case 'bottom-left':
        return {
          bottom: offset + insets.bottom,
          left: offset,
        };
      case 'top-right':
        return {
          top: offset + insets.top,
          right: offset,
        };
      case 'top-left':
        return {
          top: offset + insets.top,
          left: offset,
        };
      case 'bottom-right':
      default:
        return {
          bottom: offset + insets.bottom,
          right: offset,
        };
    }
  };

  // プレスアニメーション
  const handlePressIn = () => {
    setIsPressed(true);
    
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: animationDuration,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      // 回転をリセット
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // パルスアニメーション（位置情報取得中）
  React.useEffect(() => {
    if (isLocationLoading) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isLocationLoading, pulseAnim]);

  const handlePress = () => {
    // 600msスムーズアニメーション効果のフィードバック
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    
    onPress();
  };

  const dimensions = getSizeDimensions();
  const positionStyle = getPositionStyle();

  // 回転アニメーション値
  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        positionStyle,
        {
          width: dimensions.width,
          height: dimensions.height,
          transform: [
            {scale: Animated.multiply(scaleAnim, pulseAnim)},
            {rotate: rotateInterpolate},
          ],
        },
        style,
      ]}>
      
      <TouchableOpacity
        style={[
          styles.fab,
          {
            width: dimensions.width,
            height: dimensions.height,
            backgroundColor: getAccentColor(),
          },
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}>
        
        {/* アイコン */}
        <View style={styles.iconContainer}>
          {isLocationLoading ? (
            <View style={styles.loadingIcon}>
              <Text style={[styles.icon, {fontSize: dimensions.iconSize - 2}]}>⟲</Text>
            </View>
          ) : (
            <Text style={[styles.icon, {fontSize: dimensions.iconSize}]}>📍</Text>
          )}
        </View>
        
        {/* リップル効果 */}
        {isPressed && (
          <Animated.View style={[
            styles.ripple,
            {
              width: dimensions.width * 1.5,
              height: dimensions.height * 1.5,
              borderRadius: dimensions.width * 0.75,
              backgroundColor: getAccentColor(),
            }
          ]} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000,
  },
  
  fab: {
    borderRadius: 28, // 完全な円形
    alignItems: 'center',
    justifyContent: 'center',
    ...GoTheme.shadows.large,
    elevation: 8, // Android shadow
  },
  
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  icon: {
    color: GoTheme.colors.white,
    textAlign: 'center',
  },
  
  loadingIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  ripple: {
    position: 'absolute',
    opacity: 0.3,
    zIndex: -1,
  },
});