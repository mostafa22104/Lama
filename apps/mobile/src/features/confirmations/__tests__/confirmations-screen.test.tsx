import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import MockAdapter from 'axios-mock-adapter';
import { NavigationContainer } from '@react-navigation/native';
import { api } from '../../../core/api/instances';
import { renderWithProviders } from '../../../testing/render';
import { ConfirmationsScreen } from '../screens/ConfirmationsScreen';

describe('ConfirmationsScreen', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api);
  });

  afterEach(() => {
    mock.restore();
  });

  const mockClaims = [
    {
      id: 'cl-1',
      invoiceId: 'inv-1',
      customerId: 'c-1',
      customerName: 'أحمد السيد',
      customerPhone: '+201066667777',
      chargeTitle: 'اشتراك تدريب خاص',
      invoiceAmount: 600,
      extractedAmount: 600,
      extractedDate: '2026-10-05',
      transactionId: 'IP-20261014-9982',
      recipient: 'nogoum.academy@instapay',
      rawText: 'text',
      checkAmount: true,
      checkDate: true,
      checkRecipient: true,
      duplicateOfClaimId: null,
      verdict: 'all_match' as const,
      createdAt: '2026-10-19T14:11:19.875Z',
      screenshotKey: 'claims/ahmed.png',
    },
    {
      id: 'cl-2',
      invoiceId: 'inv-2',
      customerId: 'c-2',
      customerName: 'رنا الشريف',
      customerPhone: '+201012340004',
      chargeTitle: 'اشتراك شهري أساسي',
      invoiceAmount: 450,
      extractedAmount: 400,
      extractedDate: '2026-10-05',
      transactionId: 'IP-20261013-5431',
      recipient: 'nogoum.academy@instapay',
      rawText: 'text',
      checkAmount: false,
      checkDate: true,
      checkRecipient: true,
      duplicateOfClaimId: null,
      verdict: 'amount_differs' as const,
      createdAt: '2026-10-19T14:11:19.880Z',
      screenshotKey: 'claims/rana.png',
    },
  ];

  it('renders pending claims list with verdict and details', async () => {
    mock.onGet('/payments/claims').reply(200, mockClaims);

    await renderWithProviders(
      <NavigationContainer>
        <ConfirmationsScreen />
      </NavigationContainer>,
    );

    expect(await screen.findByText('تأكيد الدفع')).toBeTruthy();
    expect(screen.getByText('2 مستنيين')).toBeTruthy();
    expect(screen.getByText('أحمد السيد')).toBeTruthy();
    expect(screen.getByText('رنا الشريف')).toBeTruthy();
    expect(screen.getByText('كله مطابق')).toBeTruthy();
  });

  it('handles confirming a claim', async () => {
    mock.onGet('/payments/claims').reply(200, mockClaims);
    mock.onPost('/payments/claims/cl-1/confirm').reply(200, { success: true });

    await renderWithProviders(
      <NavigationContainer>
        <ConfirmationsScreen />
      </NavigationContainer>,
    );

    expect(await screen.findByText('أحمد السيد')).toBeTruthy();
    const confirmButtons = screen.getAllByText('تأكيد');
    fireEvent.press(confirmButtons[0]);

    expect(await screen.findByText('تم تأكيد دفعة أحمد السيد')).toBeTruthy();
  });

  it('renders empty state when there are no claims', async () => {
    mock.onGet('/payments/claims').reply(200, []);

    await renderWithProviders(
      <NavigationContainer>
        <ConfirmationsScreen />
      </NavigationContainer>,
    );

    expect(await screen.findByText('مفيش تحويلات مستنية تأكيدك')).toBeTruthy();
  });
});
