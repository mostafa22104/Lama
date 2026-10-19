import React from 'react';
import { screen } from '@testing-library/react-native';
import MockAdapter from 'axios-mock-adapter';
import { NavigationContainer } from '@react-navigation/native';
import { api } from '../../../core/api/instances';
import { renderWithProviders } from '../../../testing/render';
import { ReportsScreen } from '../screens/ReportsScreen';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn(), canGoBack: () => true }),
}));

describe('ReportsScreen', () => {
  let mock: MockAdapter;
  beforeEach(() => {
    mock = new MockAdapter(api);
    mockNavigate.mockClear();
  });
  afterEach(() => mock.restore());

  it('renders monthly report details', async () => {
    mock.onGet('/reports/monthly').reply(200, {
      period: '2026-10',
      expected: 31500,
      collected: 23400,
      previousCollected: 19800,
      invoiceCount: 68,
      paidInvoiceCount: 56,
      stillLate: [
        {
          id: 'c-1',
          name: 'محمود حسن',
          phone: '+201011112222',
          note: 'متأخر 3 أيام',
          gender: 'male',
          createdAt: '2026-10-19T14:11:19.835Z',
          balance: 450,
          status: 'overdue',
          headline: null,
        },
      ],
    });

    await renderWithProviders(
      <NavigationContainer>
        <ReportsScreen />
      </NavigationContainer>,
    );

    expect(await screen.findByText('لمّينا لك')).toBeTruthy();
    expect(screen.getByText('مقارنة بالشهر اللي فات')).toBeTruthy();
    expect(screen.getByText('دفعوا')).toBeTruthy();
    expect(screen.getByText('56')).toBeTruthy();
  });
});
