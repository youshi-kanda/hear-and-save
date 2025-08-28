import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {SplashScreen} from '../screens/SplashScreen';
import {HomeScreen} from '../screens/HomeScreen';
import {LoginScreen} from '../screens/LoginScreen';
import {ModeSelectScreen} from '../screens/ModeSelectScreen';
import {TaxiSelectionScreen} from '../screens/TaxiSelectionScreen';
import {TaxiBookingScreen} from '../screens/taxi/TaxiBookingScreen';
import {ShipBookingScreen} from '../screens/ship/ShipBookingScreen';
import {ProfileScreen} from '../screens/ProfileScreen';
import {ProfileEditScreen} from '../screens/ProfileEditScreen';
import {SettingsScreen} from '../screens/SettingsScreen';
import {FavoriteLocationsScreen} from '../screens/FavoriteLocationsScreen';
import {RatingScreen} from '../screens/RatingScreen';
import {TaxiTrackingScreen} from '../screens/taxi/TaxiTrackingScreen';
import {ShipTrackingScreen} from '../screens/ship/ShipTrackingScreen';
import {PaymentScreen} from '../screens/PaymentScreen';
import {BookingHistoryScreen} from '../screens/BookingHistoryScreen';
import {QRScannerScreen} from '../screens/QRScannerScreen';
import {QRHistoryScreen} from '../screens/QRHistoryScreen';
import {NetworkTestScreen} from '../screens/NetworkTestScreen';
import {OnboardingScreen} from '../screens/OnboardingScreen';
// GO仕様: ボトムタブナビゲーター復活
import {GoBottomTabNavigator} from './GoBottomTabNavigator';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: { isSignup?: boolean } | undefined;
  // GO仕様: ボトムタブナビゲーターを復活
  Main: undefined;
  Home: undefined;
  ModeSelect: undefined;
  TaxiSelection: {
    pickup: {
      latitude: number;
      longitude: number;
      address: string;
    };
    destination?: {
      latitude: number;
      longitude: number;
      address: string;
    };
  };
  TaxiBooking: undefined;
  ShipBooking: undefined;
  Profile: undefined;
  ProfileEdit: undefined;
  Settings: undefined;
  FavoriteLocations: undefined;
  Rating: {
    bookingId: string;
    serviceType: 'taxi' | 'ship';
    driverName?: string;
    vehicleInfo?: string;
    tripData?: {
      pickup: string;
      destination: string;
      duration: number;
      distance: number;
      fare: number;
    };
  };
  TaxiTracking: {bookingId?: string; bookingData?: any};
  ShipTracking: {bookingId?: string; bookingData?: any};
  QRScanner: undefined;
  QRHistory: undefined;
  NetworkTest: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
        }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        {/* GO仕様: メインタブナビゲーターを最初に表示 */}
        <Stack.Screen name="Main" component={GoBottomTabNavigator} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="ModeSelect" component={ModeSelectScreen} />
        <Stack.Screen name="TaxiSelection" component={TaxiSelectionScreen} />
        <Stack.Screen name="TaxiBooking" component={TaxiBookingScreen} />
        <Stack.Screen name="ShipBooking" component={ShipBookingScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="FavoriteLocations" component={FavoriteLocationsScreen} />
        <Stack.Screen name="Rating" component={RatingScreen} />
        <Stack.Screen name="TaxiTracking" component={TaxiTrackingScreen} />
        <Stack.Screen name="ShipTracking" component={ShipTrackingScreen} />
        <Stack.Screen name="QRScanner" component={QRScannerScreen} />
        <Stack.Screen name="QRHistory" component={QRHistoryScreen} />
        <Stack.Screen name="NetworkTest" component={NetworkTestScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};