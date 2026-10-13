import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { installAuthHooks, restoreSession } from '../features/auth';
import { ThemeProvider, useTheme } from '../theme';
import { toNavigationTheme } from './navigation/navigation-theme';
import { RootNavigator } from './navigation/RootNavigator';
import { I18nProvider } from './providers/I18nProvider';
import { QueryProvider } from './providers/QueryProvider';

function ThemedNavigation() {
  const theme = useTheme();
  return (
    <NavigationContainer theme={toNavigationTheme(theme)}>
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  useEffect(() => {
    installAuthHooks();
    void restoreSession();
  }, []);
  return (
    <SafeAreaProvider>
      <QueryProvider>
        <ThemeProvider>
          <I18nProvider>
            <ThemedNavigation />
          </I18nProvider>
        </ThemeProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
