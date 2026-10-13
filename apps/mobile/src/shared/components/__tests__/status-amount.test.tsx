import React from 'react';
import { screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../../testing/render';
import { AmountInput, AmountText, StatusChip } from '../index';

describe('status and money', () => {
  it('shows the Arabic chip label for each status and nothing for upcoming', async () => {
    await renderWithProviders(
      <>
        <StatusChip status="overdue" />
        <StatusChip status="awaiting_confirmation" />
        <StatusChip status="upcoming" />
      </>,
    );
    expect(screen.getByText('متأخر')).toBeTruthy();
    expect(screen.getByText('في انتظار التأكيد')).toBeTruthy();
    expect(screen.queryByText('مستحق')).toBeNull();
  });

  it('formats amounts with Western digits and a separate currency label', async () => {
    await renderWithProviders(<AmountText amount={23400} size="large" />);
    expect(screen.getByText('23,400')).toBeTruthy();
    expect(screen.getByText('ج.م')).toBeTruthy();
  });

  it('AmountInput uses a number pad and the currency suffix', async () => {
    await renderWithProviders(<AmountInput label="المبلغ" />);
    expect(screen.getByLabelText('المبلغ').props.keyboardType).toBe('number-pad');
    expect(screen.getByText('ج.م')).toBeTruthy();
  });
});
