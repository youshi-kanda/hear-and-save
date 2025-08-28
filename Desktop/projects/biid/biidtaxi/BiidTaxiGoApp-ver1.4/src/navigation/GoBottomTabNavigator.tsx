import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {View, Text, StyleSheet} from 'react-native';
import {GoTheme} from '../theme/GoTheme';

// Screens
import {HomeScreen} from '../screens/HomeScreen';
import {ShipBookingScreen} from '../screens/ship/ShipBookingScreen';
import {PaymentScreen} from '../screens/PaymentScreen';
import {BookingHistoryScreen} from '../screens/BookingHistoryScreen';

// Wrapper component for PaymentScreen to match tab structure
const PaymentTabScreenWrapper: React.FC<{navigation?: any; route?: any}> = (props) => {
  // NavigationとrouteのデフォルトPropsを提供
  const defaultProps = {
    navigation: props.navigation || {
      navigate: () => {},
      goBack: () => {},
    },
    route: props.route || {
      params: {}
    }
  };
  return <PaymentScreen {...defaultProps} />;
};

export type GoBottomTabParamList = {
  今すぐ呼ぶ: undefined;
  予約: undefined;
  'GO Pay': undefined;
  'GOシャトル': undefined;
  配車リスト: undefined;
};

const Tab = createBottomTabNavigator<GoBottomTabParamList>();

interface TabIconProps {
  focused: boolean;
  color: string;
  size: number;
  icon: string;
  label: string;
}

const TabIcon: React.FC<TabIconProps> = ({focused, color, icon, label}) => {
  const iconStyle = [
    styles.tabIcon, 
    {color}, 
    focused ? styles.tabIconFocused : styles.tabIconDefault
  ];
  const labelStyle = [
    styles.tabLabel, 
    {color}, 
    focused ? styles.tabLabelFocused : styles.tabLabelDefault
  ];

  return (
    <View style={styles.tabIconContainer}>
      <Text style={iconStyle}>
        {icon}
      </Text>
      <Text style={labelStyle}>
        {label}
      </Text>
    </View>
  );
};

export const GoBottomTabNavigator: React.FC = () => {
  // GO仕様: タクシーモード固定のため、useThemeは不要

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: GoTheme.colors.primary, // GO仕様: 濃紺アクティブ色
        tabBarInactiveTintColor: GoTheme.colors.textSecondary, // GO仕様: グレー非アクティブ色
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: GoTheme.colors.surface, // GO仕様: 白背景
            borderTopColor: GoTheme.colors.border, // GO仕様: ボーダー色
          },
        ],
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIconStyle: styles.tabBarIcon,
        tabBarItemStyle: styles.tabBarItem,
      }}>
      
      <Tab.Screen
        name="今すぐ呼ぶ"
        component={HomeScreen}
        options={{
          tabBarIcon: ({focused, color, size}) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              icon="🚖"
              label="今すぐ呼ぶ"
            />
          ),
          tabBarLabel: () => null,
        }}
      />
      
      <Tab.Screen
        name="予約"
        component={ShipBookingScreen}
        options={{
          tabBarIcon: ({focused, color, size}) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              icon="📅"
              label="予約"
            />
          ),
          tabBarLabel: () => null,
        }}
      />
      
      <Tab.Screen
        name="GO Pay"
        component={PaymentTabScreenWrapper}
        options={{
          tabBarIcon: ({focused, color, size}) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              icon="💰"
              label="GO Pay"
            />
          ),
          tabBarLabel: () => null,
        }}
      />
      
      <Tab.Screen
        name="GOシャトル"
        component={ShipBookingScreen}
        options={{
          tabBarIcon: ({focused, color, size}) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              icon="🚌"
              label="GOシャトル"
            />
          ),
          tabBarLabel: () => null,
        }}
      />
      
      <Tab.Screen
        name="配車リスト"
        component={BookingHistoryScreen}
        options={{
          tabBarIcon: ({focused, color, size}) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              icon="📋"
              label="配車リスト"
            />
          ),
          tabBarLabel: () => null,
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  // GO仕様: タブバー（5つのタブ対応）
  tabBar: {
    height: GoTheme.go.tabBarHeight, // 60dp
    paddingBottom: GoTheme.spacing.xs, // 4dp
    paddingTop: GoTheme.spacing.xs, // 4dp
    paddingHorizontal: GoTheme.spacing.xs, // 4dp: 5つのタブ用スペース調整
    borderTopWidth: 1,
    ...GoTheme.shadows.medium, // GO仕様: 標準化された影
  },
  
  // GO仕様: タブアイテム（5つのタブ最適化）
  tabBarItem: {
    paddingVertical: GoTheme.spacing.xs, // 4dp
    paddingHorizontal: GoTheme.spacing.xs / 2, // 2dp: 5つのタブ用コンパクト化
    flex: 1,
  },
  tabBarIcon: {
    marginBottom: 0,
  },
  tabBarLabel: {
    ...GoTheme.typography.captionSmall, // GO仕様: 統一フォント
    marginTop: GoTheme.spacing.xs / 2, // 2dp
  },

  // GO仕様: カスタムタブアイコンコンテナ
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: GoTheme.go.tabBarHeight - GoTheme.spacing.sm, // 52dp: タブ高さ - パディング
    paddingHorizontal: GoTheme.spacing.xs / 2, // 2dp: 5つのタブ用スペース節約
  },
  tabIcon: {
    marginBottom: GoTheme.spacing.xs / 2, // 2dp
  },
  tabIconDefault: {
    fontSize: 18, // GO仕様: コンパクト化
  },
  tabIconFocused: {
    fontSize: 20, // GO仕様: コンパクト化
  },
  tabLabel: {
    ...GoTheme.typography.captionSmall, // GO仕様: 統一フォント
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 12,
  },
  tabLabelDefault: {
    fontSize: 9, // GO仕様: 5つのタブ用コンパクト化
  },
  tabLabelFocused: {
    fontSize: 10, // GO仕様: 5つのタブ用コンパクト化
    fontWeight: '700', // GO仕様: アクティブタブ強調
  },
});