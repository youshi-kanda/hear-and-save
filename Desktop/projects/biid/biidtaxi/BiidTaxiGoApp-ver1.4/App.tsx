/**
 * BiidTaxi GO Style App
 * タクシー・船舶予約アプリ
 *
 * @format
 */

import React from 'react';
import 'react-native-gesture-handler';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
// import {StripeProvider} from '@stripe/stripe-react-native'; // Temporarily disabled
import {AppNavigator} from './src/navigation/AppNavigator';
import {AuthProvider} from './src/contexts/AuthContext';
import {ThemeProvider} from './src/contexts/ThemeContext';

const STRIPE_PUBLISHABLE_KEY = __DEV__ 
  ? 'pk_test_51NnABCDEFGH123456789' // テスト用キー（実際のキーに置き換え）
  : 'pk_live_51NnABCDEFGH123456789'; // 本番用キー（実際のキーに置き換え）

function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <ThemeProvider initialMode="taxi">
        {/* <StripeProvider
          publishableKey={STRIPE_PUBLISHABLE_KEY}
          merchantIdentifier="merchant.com.biidtaxi.app"
          urlScheme="biidtaxi"> */}
          <AuthProvider>
            <AppNavigator />
          </AuthProvider>
        {/* </StripeProvider> */}
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

export default App;