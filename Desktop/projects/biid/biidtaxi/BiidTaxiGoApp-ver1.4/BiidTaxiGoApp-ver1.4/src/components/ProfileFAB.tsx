import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

export interface ProfileFABProps {
  onPress?: () => void;
  hasNotifications?: boolean;
  style?: ViewStyle;
}

export const ProfileFAB: React.FC<ProfileFABProps> = ({
  onPress = () => {},
  hasNotifications = false,
  style,
}) => {
  const insets = useSafeAreaInsets();
  const [isPressed, setIsPressed] = useState(false);

  return (
    <TouchableOpacity
      style={[
        styles.fab,
        {
          top: insets.top + 16,
          right: 16,
        },
        isPressed && styles.pressed,
        style,
      ]}
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      activeOpacity={0.9}
      accessibilityLabel="プロフィール"
      accessibilityRole="button">
      
      <View style={styles.iconContainer}>
        <Text style={styles.profileIcon}>👤</Text>
        
        {/* 通知バッジ */}
        {hasNotifications && (
          <View style={styles.badge} />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    // GO仕様: elevation 4
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  
  pressed: {
    transform: [{scale: 0.95}],
  },
  
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  
  profileIcon: {
    fontSize: 18,
    color: '#333333',
  },
  
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF4444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});