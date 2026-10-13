import React from 'react';
import { screen, userEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../../../testing/render';
import { Avatar, CustomerRow, Toggle } from '../index';

describe('rows and toggles', () => {
  it('Avatar shows the first letter', async () => {
    await renderWithProviders(<Avatar name="محمود حسن" />);
    expect(screen.getByText('م')).toBeTruthy();
  });

  it('CustomerRow shows name, subtitle, amount and status and is pressable', async () => {
    const onPress = jest.fn();
    await renderWithProviders(
      <CustomerRow name="محمود حسن" subtitle="اشتراك سبتمبر · متأخر 3 أيام" amount={450} status="overdue" onPress={onPress} />,
    );
    expect(screen.getByText('اشتراك سبتمبر · متأخر 3 أيام')).toBeTruthy();
    expect(screen.getByText('450')).toBeTruthy();
    expect(screen.getByText('متأخر')).toBeTruthy();
    await userEvent.setup().press(screen.getByRole('button', { name: /محمود حسن/ }));
    expect(onPress).toHaveBeenCalled();
  });

  it('CustomerRow announces name, subtitle, amount with currency and status as one label', async () => {
    await renderWithProviders(
      <CustomerRow name="محمود حسن" subtitle="اشتراك سبتمبر · متأخر 3 أيام" amount={450} status="overdue" />,
    );
    expect(screen.getByLabelText(/محمود حسن .*450 ج\.م متأخر$/)).toBeTruthy();
  });

  it('Toggle is an accessible switch', async () => {
    const onChange = jest.fn();
    await renderWithProviders(<Toggle label="باك أب" value={false} onChange={onChange} />);
    const toggle = screen.getByRole('switch', { name: 'باك أب' });
    expect(toggle).not.toBeChecked();
    await userEvent.setup().press(toggle);
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
