import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {GoTheme} from '../theme/GoTheme';

const { width } = Dimensions.get('window');

export interface GoTaxiBottomNavigationProps {
  activeTab?: string;
  onTabPress?: (tabId: string) => void;
}

interface TabItem {
  id: string;
  icon: string;
  label: string;
}

const TABS: TabItem[] = [
  { id: 'ride_now', icon: '○', label: '今すぐ呼ぶ' },
  { id: 'reservation', icon: '⌛', label: '予約' },
  { id: 'go_pay', icon: '□', label: 'GO Pay' },
  { id: 'go_shuttle', icon: '⇄', label: 'GOシャトル' },
  { id: 'ride_list', icon: '≡', label: '配車リスト' },
];

export const GoTaxiBottomNavigation: React.FC<GoTaxiBottomNavigationProps> = ({
  activeTab = 'ride_now',
  onTabPress,
}) => {
  const insets = useSafeAreaInsets();

  const handleTabPress = (tabId: string) => {
    onTabPress?.(tabId);
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, GoTheme.spacing.md),
        },
      ]}
    >
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabButton}
              onPress={() => handleTabPress(tab.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabIcon, isActive && styles.activeTabIcon]}>
                {tab.icon}
              </Text>
              <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: GoTheme.colors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: GoTheme.spacing.sm,
    paddingHorizontal: GoTheme.spacing.xs,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: GoTheme.spacing.xs,
    minHeight: 60,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
    opacity: 0.6,
  },
  activeTabIcon: {
    opacity: 1.0,
  },
  tabLabel: {
    fontSize: 10,
    color: GoTheme.colors.textTertiary,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 12,
  },
  activeTabLabel: {
    color: GoTheme.colors.primary, // #2A78FF - GOタクシーブルー
    fontWeight: '600',
  },
});

export default GoTaxiBottomNavigation;