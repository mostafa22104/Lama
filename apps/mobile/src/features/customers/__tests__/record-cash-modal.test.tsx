import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import type { InvoiceSummaryDto } from '@lamma/shared';
import { renderWithProviders } from '../../../testing/render';
import { RecordCashModal } from '../components/RecordCashModal';

const sampleInvoices: InvoiceSummaryDto[] = [
  {
    id: 'inv-1',
    chargeId: 'ch-1',
    customerId: 'c-1',
    title: 'اشتراك شهري أساسي',
    period: '2026-10',
    amount: 500,
    dueDate: '2026-10-05',
    status: 'overdue',
    publicToken: 'tok-1',
  },
  {
    id: 'inv-2',
    chargeId: 'ch-2',
    customerId: 'c-1',
    title: 'كامب الصيف',
    period: null,
    amount: 300,
    dueDate: '2026-10-15',
    status: 'due_soon',
    publicToken: 'tok-2',
  },
];

describe('RecordCashModal', () => {
  it('renders open invoices and allows selecting a subscription and entering partial payment', async () => {
    const onSubmit = jest.fn();
    const onClose = jest.fn();

    await renderWithProviders(
      <RecordCashModal
        visible={true}
        invoices={sampleInvoices}
        isPending={false}
        onClose={onClose}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByText('تسجيل دفع كاش')).toBeTruthy();
    expect(screen.getByText('اشتراك شهري أساسي أكتوبر')).toBeTruthy();
    expect(screen.getByText('كامب الصيف')).toBeTruthy();

    // Select the second subscription (كامب الصيف)
    fireEvent.press(screen.getByTestId('invoice-item-inv-2'));

    // Check input is updated to 300
    const input = await screen.findByDisplayValue('300');
    expect(input).toBeTruthy();

    // Enter partial amount: 100
    fireEvent.changeText(input, '100');

    // Should show partial payment notice: "سيتبقى 200"
    expect(await screen.findByText(/دفعة جزئية: سيتبقى 200/)).toBeTruthy();

    // Confirm button
    const confirmBtn = await screen.findByText(/تأكيد دفع \(100/);
    fireEvent.press(confirmBtn);

    expect(onSubmit).toHaveBeenCalledWith('inv-2', 100);
  });
});
