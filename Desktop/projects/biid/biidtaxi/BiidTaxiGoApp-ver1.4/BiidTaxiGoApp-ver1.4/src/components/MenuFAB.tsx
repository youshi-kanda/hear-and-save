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

export interface MenuFABProps {
  onPress?: () => void;
  style?: ViewStyle;
}

export const MenuFAB: React.FC<MenuFABProps> = ({
  onPress = () => {},
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
          left: 16,
        },
        isPressed && styles.pressed,
        style,
      ]}
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      activeOpacity={0.9}
      accessibilityLabel="メニュー"
      accessibilityRole="button">
      
      <View style={styles.iconContainer}>
        <Text style={styles.menuIcon}>☰</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    // GO仕様: elevation 6
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
  
  menuIcon: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
  },
});