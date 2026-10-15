import React from 'react';
import { act, screen, userEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../../features/auth';
import { renderWithProviders } from '../../testing/render';
import { RootNavigator } from '../navigation/RootNavigator';

const mockRestoreSession = jest.fn().mockImplementation(async () => undefined);

jest.mock('../../features/auth', () => {
  const actual = jest.requireActual('../../features/auth');
  return {
    ...actual,
    restoreSession: () => mockRestoreSession(),
  };
});

async function renderRoot() {
  await renderWithProviders(
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>,
  );
}

describe('RootNavigator', () => {
  it('shows the auth flow when signed out', async () => {
    useAuthStore.setState({ status: 'signedOut', accessToken: null, business: null });
    await renderRoot();
    expect(await screen.findByTestId('signup-screen')).toBeTruthy();
  });

  it('shows the four tabs when signed in', async () => {
    useAuthStore.setState({ status: 'signedIn', accessToken: 'a', business: null });
    await renderRoot();
    for (const label of ['الرئيسية', 'العملاء', 'التأكيدات', 'التقارير']) {
      expect(await screen.findByRole('tab', { name: label })).toBeTruthy();
    }
  });

  it('switches to the tabs as soon as the session is signed in', async () => {
    useAuthStore.setState({ status: 'signedOut', accessToken: null, business: null });
    await renderRoot();
    await act(async () => useAuthStore.setState({ status: 'signedIn', accessToken: 'a' }));
    expect(await screen.findByRole('tab', { name: 'الرئيسية' })).toBeTruthy();
  });

  it('shows the offline screen with a retry button', async () => {
    useAuthStore.setState({ status: 'offline', accessToken: null, business: null });
    await renderRoot();
    expect(screen.getByText('مفيش إنترنت')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'جرّب تاني' })).toBeTruthy();
  });

  it('calls restoreSession once when pressing retry on the offline screen', async () => {
    mockRestoreSession.mockClear();
    useAuthStore.setState({ status: 'offline', accessToken: null, business: null });
    await renderRoot();
    const user = userEvent.setup();
    await user.press(screen.getByRole('button', { name: 'جرّب تاني' }));
    expect(mockRestoreSession).toHaveBeenCalledTimes(1);
  });
});
