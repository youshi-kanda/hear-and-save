import React, {useRef, useEffect} from 'react';
import {
  View,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import {GoTheme} from '../theme/GoTheme';

export interface GoCurrentLocationPinProps {
  accuracy?: number; // GPS accuracy in meters
  isActive?: boolean;
  style?: ViewStyle;
  size?: 'small' | 'medium' | 'large';
}

export const GoCurrentLocationPin: React.FC<GoCurrentLocationPinProps> = ({
  accuracy = 10,
  isActive = true,
  style,
  size = 'medium',
}) => {
  // GO仕様: GOタクシーブルー色（公式準拠）
  const goBlueColor = GoTheme.colors.primary; // #2A78FF GOタクシーブルー
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.6)).current;
  
  // Size configuration
  const getSizeValues = () => {
    switch (size) {
      case 'small':
        return { 
          innerRadius: 6, 
          outerRadius: 18,
          borderWidth: 2 
        };
      case 'large':
        return { 
          innerRadius: 12, 
          outerRadius: 32,
          borderWidth: 3 
        };
      default: // medium
        return { 
          innerRadius: 10, 
          outerRadius: 28,
          borderWidth: 3 
        };
    }
  };

  const sizeValues = getSizeValues();

  // Pulse animation for active state
  useEffect(() => {
    if (isActive) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      
      const opacityAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0.3,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.6,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );

      pulseAnimation.start();
      opacityAnimation.start();

      return () => {
        pulseAnimation.stop();
        opacityAnimation.stop();
      };
    } else {
      pulseAnim.setValue(1);
      opacityAnim.setValue(0.4);
    }
  }, [isActive, pulseAnim, opacityAnim]);

  return (
    <View 
      style={[
        styles.container,
        {
          width: sizeValues.outerRadius * 2,
          height: sizeValues.outerRadius * 2,
        },
        style
      ]} 
      pointerEvents="none">
      
      {/* GO仕様: 外側パルスリング（二重リング効果） */}
      <Animated.View
        style={[
          styles.accuracyRing,
          {
            width: sizeValues.outerRadius * 2,
            height: sizeValues.outerRadius * 2,
            borderRadius: sizeValues.outerRadius,
            backgroundColor: 'transparent',
            borderColor: goBlueColor,
            borderWidth: 3,
            transform: [{scale: pulseAnim}],
            opacity: opacityAnim,
          },
        ]}
      />
      
      {/* GO仕様: 中間リング（二重リング効果） */}
      <View
        style={[
          styles.middleRing,
          {
            width: (sizeValues.innerRadius + 4) * 2,
            height: (sizeValues.innerRadius + 4) * 2,
            borderRadius: sizeValues.innerRadius + 4,
            backgroundColor: 'transparent',
            borderColor: goBlueColor,
            borderWidth: 2,
          },
        ]}
      />
      
      {/* GO仕様: 内側位置ドット（ソリッド青） */}
      <View
        style={[
          styles.locationDot,
          {
            width: sizeValues.innerRadius * 2,
            height: sizeValues.innerRadius * 2,
            borderRadius: sizeValues.innerRadius,
            backgroundColor: goBlueColor, 
            borderColor: GoTheme.colors.surface, 
            borderWidth: sizeValues.borderWidth,
            shadowColor: goBlueColor,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  
  // Accuracy ring (transparent circle)
  accuracyRing: {
    position: 'absolute',
    borderStyle: 'solid',
  },
  
  // Middle ring (二重リング効果)
  middleRing: {
    position: 'absolute',
    borderStyle: 'solid',
  },
  
  // Inner location dot (solid circle)
  locationDot: {
    position: 'absolute',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
});