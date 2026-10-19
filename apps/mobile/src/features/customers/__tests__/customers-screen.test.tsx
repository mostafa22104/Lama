import React from 'react';
import { screen } from '@testing-library/react-native';
import MockAdapter from 'axios-mock-adapter';
import { NavigationContainer } from '@react-navigation/native';
import { api } from '../../../core/api/instances';
import { renderWithProviders } from '../../../testing/render';
import { CustomersScreen } from '../screens/CustomersScreen';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn(), canGoBack: () => true }),
}));

describe('CustomersScreen', () => {
  let mock: MockAdapter;
  beforeEach(() => {
    mock = new MockAdapter(api);
    mockNavigate.mockClear();
  });
  afterEach(() => mock.restore());

  it('renders customers list and filters', async () => {
    mock.onGet('/customers').reply(200, [
      {
        id: 'c-1',
        name: 'محمود حسن',
        phone: '+201011112222',
        note: 'ولي أمر يوسف',
        gender: 'male',
        createdAt: '2026-10-19T14:11:19.835Z',
        balance: 450,
        status: 'overdue',
        headline: {
          id: 'inv-1',
          chargeId: 'ch-1',
          customerId: 'c-1',
          title: 'اشتراك شهري أساسي',
          period: '2026-10',
          amount: 450,
          dueDate: '2026-10-05',
          status: 'overdue',
          publicToken: 'tok-1',
        },
      },
    ]);

    await renderWithProviders(
      <NavigationContainer>
        <CustomersScreen />
      </NavigationContainer>,
    );

    expect(await screen.findByText('محمود حسن')).toBeTruthy();
    expect(screen.getByText('العملاء')).toBeTruthy();
    expect(screen.getByText('الكل')).toBeTruthy();
  });
});
