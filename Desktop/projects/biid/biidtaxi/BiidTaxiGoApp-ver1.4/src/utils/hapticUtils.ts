import { Vibration, Platform } from 'react-native';

/**
 * Haptic feedback utility for consistent cross-platform tactile feedback
 */
export class HapticUtils {
  /**
   * Light haptic feedback - for subtle interactions like button hover
   */
  static light() {
    if (Platform.OS === 'ios') {
      // iOS has more sophisticated haptic feedback options
      // For React Native 0.80+, we can use the Haptics module if available
      try {
        // @ts-ignore - Haptics module availability check
        if (typeof window !== 'undefined' && window.ReactNativeWebView) {
          return; // Skip haptics in WebView
        }
        // iOS light impact
        Vibration.vibrate([10], false);
      } catch (error) {
        console.log('Light haptic not supported');
      }
    } else {
      // Android light vibration
      Vibration.vibrate(10);
    }
  }

  /**
   * Medium haptic feedback - for standard interactions like button press
   */
  static medium() {
    if (Platform.OS === 'ios') {
      try {
        // @ts-ignore - Haptics module availability check
        if (typeof window !== 'undefined' && window.ReactNativeWebView) {
          return; // Skip haptics in WebView
        }
        // iOS medium impact
        Vibration.vibrate([25], false);
      } catch (error) {
        console.log('Medium haptic not supported');
      }
    } else {
      // Android medium vibration
      Vibration.vibrate(25);
    }
  }

  /**
   * Heavy haptic feedback - for important actions like slide transitions
   */
  static heavy() {
    if (Platform.OS === 'ios') {
      try {
        // @ts-ignore - Haptics module availability check
        if (typeof window !== 'undefined' && window.ReactNativeWebView) {
          return; // Skip haptics in WebView
        }
        // iOS heavy impact
        Vibration.vibrate([50], false);
      } catch (error) {
        console.log('Heavy haptic not supported');
      }
    } else {
      // Android heavy vibration
      Vibration.vibrate(50);
    }
  }

  /**
   * Success haptic feedback - for positive confirmations
   */
  static success() {
    if (Platform.OS === 'ios') {
      try {
        // @ts-ignore - Haptics module availability check
        if (typeof window !== 'undefined' && window.ReactNativeWebView) {
          return; // Skip haptics in WebView
        }
        // iOS success notification pattern
        Vibration.vibrate([10, 50, 10], false);
      } catch (error) {
        console.log('Success haptic not supported');
      }
    } else {
      // Android success pattern
      Vibration.vibrate([10, 50, 10]);
    }
  }

  /**
   * Selection change haptic feedback - for navigation changes
   */
  static selectionChanged() {
    if (Platform.OS === 'ios') {
      try {
        // @ts-ignore - Haptics module availability check
        if (typeof window !== 'undefined' && window.ReactNativeWebView) {
          return; // Skip haptics in WebView
        }
        // iOS selection change
        Vibration.vibrate([15], false);
      } catch (error) {
        console.log('Selection haptic not supported');
      }
    } else {
      // Android selection vibration
      Vibration.vibrate(15);
    }
  }

  /**
   * Check if haptic feedback is available on the device
   */
  static isAvailable(): boolean {
    try {
      // @ts-ignore - Haptics module availability check
      if (typeof window !== 'undefined' && window.ReactNativeWebView) {
        return false; // Skip haptics in WebView
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Disable haptics for accessibility (respects system settings)
   */
  static shouldDisableForAccessibility(isReduceMotionEnabled: boolean): boolean {
    return isReduceMotionEnabled; // Users who prefer reduced motion often prefer reduced haptics too
  }
}