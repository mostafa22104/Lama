import React, { type ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nProvider } from '../app/providers/I18nProvider';
import { initI18n } from '../i18n';
import { ThemeProvider } from '../theme';

/** Renders with the real theme, Arabic i18n and a fresh query client. Always `await` it (RNTL 14). */
export function renderWithProviders(ui: ReactElement) {
  initI18n('ar');
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } });
  return render(
    <SafeAreaProvider>
      <QueryClientProvider client={client}>
        <ThemeProvider>
          <I18nProvider>{ui}</I18nProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
}
