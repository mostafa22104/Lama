import React from 'react';
import { Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { darkTheme, lightTheme } from '@lamma/shared';
import { makeStyles, resolveThemeName, ThemeProvider, useTheme, useThemeStore } from '../index';

function Probe() {
  const theme = useTheme();
  return <Text testID="probe">{`${theme.name} ${theme.colors.bg} ${theme.fonts[700]}`}</Text>;
}

const useProbeStyles = makeStyles((t) => ({ box: { backgroundColor: t.colors.surface } }));

describe('theme', () => {
  beforeEach(async () => await act(async () => useThemeStore.getState().setMode('system')));

  it('resolves system mode from the phone scheme', () => {
    expect(resolveThemeName('system', 'dark')).toBe('dark');
    expect(resolveThemeName('system', null)).toBe('light');
    expect(resolveThemeName('light', 'dark')).toBe('light');
    expect(resolveThemeName('dark', 'light')).toBe('dark');
  });

  it('provides the selected theme', async () => {
    await render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    await act(async () => useThemeStore.getState().setMode('dark'));
    expect(screen.getByTestId('probe').props.children).toBe(
      `dark ${darkTheme.colors.bg} IBMPlexSansArabic-Bold`,
    );
    await act(async () => useThemeStore.getState().setMode('light'));
    expect(screen.getByTestId('probe').props.children).toBe(
      `light ${lightTheme.colors.bg} IBMPlexSansArabic-Bold`,
    );
  });

  it('persists the chosen mode', async () => {
    await act(async () => useThemeStore.getState().setMode('dark'));
    expect(useThemeStore.persist.getOptions().name).toBe('theme');
    expect(useThemeStore.getState().mode).toBe('dark');
  });

  it('memoizes styles per theme', async () => {
    const seen: unknown[] = [];
    function StyleProbe() {
      seen.push(useProbeStyles());
      return null;
    }
    const view = await render(
      <ThemeProvider>
        <StyleProbe />
      </ThemeProvider>,
    );
    await view.rerender(
      <ThemeProvider>
        <StyleProbe />
      </ThemeProvider>,
    );
    expect(seen[0]).toBe(seen[1]);
  });
});
