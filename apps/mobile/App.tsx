import React from 'react';
import {StatusBar} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AuthProvider} from './src/context/AuthContext';
import {AiChatProvider} from './src/ai/AiChatProvider';
import {I18nProvider} from './src/i18n/I18nProvider';
import {RootNavigator} from './src/navigation/RootNavigator';
import {theme} from './src/theme';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={theme.colors.background}
        />
        <I18nProvider>
          <AuthProvider>
            <AiChatProvider>
              <RootNavigator />
            </AiChatProvider>
          </AuthProvider>
        </I18nProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = {
  root: {flex: 1, backgroundColor: theme.colors.background},
};
