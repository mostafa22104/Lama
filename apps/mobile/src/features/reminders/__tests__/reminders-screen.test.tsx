import React from 'react';
import { screen } from '@testing-library/react-native';
import MockAdapter from 'axios-mock-adapter';
import { NavigationContainer } from '@react-navigation/native';
import { api } from '../../../core/api/instances';
import { renderWithProviders } from '../../../testing/render';
import { RemindersScreen } from '../screens/RemindersScreen';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn(), canGoBack: () => true }),
}));

describe('RemindersScreen', () => {
  let mock: MockAdapter;
  beforeEach(() => {
    mock = new MockAdapter(api);
    mockNavigate.mockClear();
  });
  afterEach(() => mock.restore());

  it('renders today reminders items and progress', async () => {
    mock.onGet('/reminders/today').reply(200, {
      date: '2026-10-19',
      total: 2,
      sentCount: 1,
      items: [
        {
          invoiceId: 'inv-1',
          customerId: 'c-1',
          customerName: 'سارة عادل',
          customerPhone: '+201055556666',
          title: 'اشتراك أكتوبر',
          period: '2026-10',
          amount: 450,
          dueDate: '2026-10-18',
          status: 'overdue',
          kind: 'after',
          message: 'تذكير',
          waUrl: 'https://wa.me/201055556666',
          sent: false,
        },
        {
          invoiceId: 'inv-2',
          customerId: 'c-2',
          customerName: 'محمود حسن',
          customerPhone: '+201011112222',
          title: 'اشتراك أكتوبر',
          period: '2026-10',
          amount: 450,
          dueDate: '2026-10-05',
          status: 'overdue',
          kind: 'after',
          message: 'تذكير',
          waUrl: 'https://wa.me/201011112222',
          sent: true,
        },
      ],
    });

    await renderWithProviders(
      <NavigationContainer>
        <RemindersScreen />
      </NavigationContainer>,
    );

    expect(await screen.findByText('تذكيرات النهارده')).toBeTruthy();
    expect(screen.getByText('سارة عادل')).toBeTruthy();
    expect(screen.getByText('محمود حسن')).toBeTruthy();
    expect(screen.getByText('اتبعت')).toBeTruthy();
  });
});
