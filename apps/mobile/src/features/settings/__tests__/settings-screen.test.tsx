import React from 'react';
import { screen } from '@testing-library/react-native';
import MockAdapter from 'axios-mock-adapter';
import { NavigationContainer } from '@react-navigation/native';
import { api } from '../../../core/api/instances';
import { renderWithProviders } from '../../../testing/render';
import { SettingsScreen } from '../screens/SettingsScreen';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn(), canGoBack: () => true }),
}));

describe('SettingsScreen', () => {
  let mock: MockAdapter;
  beforeEach(() => {
    mock = new MockAdapter(api);
    mockNavigate.mockClear();
  });
  afterEach(() => mock.restore());

  it('renders business settings and plan information', async () => {
    mock.onGet('/business').reply(200, {
      id: 'b-1',
      name: 'أكاديمية النجوم للكرة',
      type: 'academy',
      instapayAddress: 'nogoum.academy@instapay',
      phone: '+201012345678',
      email: 'captain.walid@lamma.app',
      plan: 'pro',
      logoUrl: null,
      area: 'مدينة نصر، القاهرة',
      weeklyBackup: true,
    });
    mock.onGet('/business/usage').reply(200, {
      plan: 'pro',
      customerCount: 68,
      maxCustomers: 500,
      upgradeRequestedAt: null,
    });

    await renderWithProviders(
      <NavigationContainer>
        <SettingsScreen />
      </NavigationContainer>,
    );

    expect(await screen.findByText('بيانات النشاط')).toBeTruthy();
    expect(screen.getAllByText('أكاديمية النجوم للكرة').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('nogoum.academy@instapay')).toBeTruthy();
    expect(screen.getByText('خروج')).toBeTruthy();
  });
});
