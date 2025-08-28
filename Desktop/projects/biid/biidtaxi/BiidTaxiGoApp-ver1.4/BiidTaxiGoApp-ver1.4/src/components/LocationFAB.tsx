import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  Platform,
  Animated,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

export interface LocationFABProps {
  onPress?: () => void;
  onDoublePress?: () => void; // GO仕様: 二度押し対応
  style?: ViewStyle;
}

export const LocationFAB: React.FC<LocationFABProps> = ({
  onPress = () => {},
  onDoublePress,
  style,
}) => {
  const insets = useSafeAreaInsets();
  const [isPressed, setIsPressed] = useState(false);
  
  // GO仕様: 600msアニメーション用
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  
  // 二度押し検出
  const lastTap = useRef<number>(0);
  const doubleTapDelay = 300; // ms

  const handlePress = () => {
    const now = Date.now();
    const timeSince = now - lastTap.current;
    
    // GO仕様: 600msアニメーション
    Animated.parallel([
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 150,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 500, // 600ms total animation
          useNativeDriver: true,
        }),
      ]),
    ]).start();
    
    if (timeSince < doubleTapDelay && timeSince > 0) {
      // 二度押し検出
      onDoublePress?.();
      lastTap.current = 0; // リセット
    } else {
      // 単押し
      lastTap.current = now;
      setTimeout(() => {
        if (lastTap.current === now) {
          onPress();
        }
      }, doubleTapDelay);
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: insets.bottom + 100, // BottomSheetの上に配置
          right: 16,
          transform: [{scale: scaleAnim}],
          opacity: opacityAnim,
        },
        style,
      ]}>
      
      <TouchableOpacity
        style={[
          styles.fab,
          isPressed && styles.pressed,
        ]}
        onPress={handlePress}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        activeOpacity={0.9}
        accessibilityLabel="現在地"
        accessibilityRole="button">
        
        <View style={styles.iconContainer}>
          <Text style={styles.locationIcon}>⊙</Text>
        </View>
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
    // GO仕様: 右下現在地FAB 56dp
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    // GO仕様: elevation 6 (FAB用影設定)
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 3,
        },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  
  pressed: {
    transform: [{scale: 0.95}],
  },
  
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  locationIcon: {
    fontSize: 22,
    fontWeight: '600',
    color: '#0A3A67', // GO仕様: ネイビー
  },
});