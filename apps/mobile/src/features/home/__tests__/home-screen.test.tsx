import React from 'react';
import { screen } from '@testing-library/react-native';
import MockAdapter from 'axios-mock-adapter';
import { NavigationContainer } from '@react-navigation/native';
import { api } from '../../../core/api/instances';
import { renderWithProviders } from '../../../testing/render';
import { HomeScreen } from '../screens/HomeScreen';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn(), canGoBack: () => true }),
}));

describe('HomeScreen', () => {
  let mock: MockAdapter;
  beforeEach(() => {
    mock = new MockAdapter(api);
    mockNavigate.mockClear();
  });
  afterEach(() => mock.restore());

  it('renders dashboard data correctly and allows navigation', async () => {
    mock.onGet('/dashboard/home').reply(200, {
      businessName: 'أكاديمية النجوم للكرة',
      period: '2026-10',
      expected: 31950,
      collected: 23400,
      remaining: 8550,
      collectedPercent: 73,
      overdue: { amount: 6900, customerCount: 10 },
      awaitingConfirmationCount: 3,
      todayReminders: {
        total: 7,
        sentCount: 3,
        preview: [{ customerName: 'سارة عادل' }, { customerName: 'محمود حسن' }],
      },
      overdueCustomers: [
        {
          id: 'cust-1',
          name: 'أحمد السيد',
          phone: '+201066667777',
          note: 'ولي أمر طارق',
          gender: 'male',
          createdAt: '2026-10-19T14:11:19.837Z',
          balance: 1050,
          status: 'overdue',
          headline: {
            id: 'inv-1',
            chargeId: 'ch-1',
            customerId: 'cust-1',
            title: 'اشتراك شهري أساسي',
            period: '2026-10',
            amount: 450,
            dueDate: '2026-10-05',
            status: 'overdue',
            publicToken: 'tok-1',
          },
        },
      ],
    });

    await renderWithProviders(
      <NavigationContainer>
        <HomeScreen />
      </NavigationContainer>,
    );

    expect(await screen.findByText('أكاديمية النجوم للكرة')).toBeTruthy();
    expect(screen.getByText('صباح الخير')).toBeTruthy();
    expect(screen.getByText('مستني تأكيدك')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('أحمد السيد')).toBeTruthy();
  });
});
