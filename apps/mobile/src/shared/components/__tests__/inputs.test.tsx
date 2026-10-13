import React from 'react';
import { screen, userEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../../../testing/render';
import { PhoneInput, TextField } from '../index';

describe('TextField and PhoneInput', () => {
  it('labels the input and shows the error instead of the hint', async () => {
    await renderWithProviders(<TextField label="اسم النشاط" hint="مساعدة" error="الخانة دي مطلوبة" />);
    expect(screen.getByLabelText('اسم النشاط')).toBeTruthy();
    expect(screen.getByText('الخانة دي مطلوبة')).toBeTruthy();
    expect(screen.queryByText('مساعدة')).toBeNull();
  });

  it('types into a left-to-right phone field', async () => {
    const onChangeText = jest.fn();
    await renderWithProviders(<PhoneInput label="رقم الموبايل" onChangeText={onChangeText} />);
    const input = screen.getByLabelText('رقم الموبايل');
    await userEvent.setup().type(input, '010');
    expect(onChangeText).toHaveBeenLastCalledWith('010');
    expect(input.props.keyboardType).toBe('phone-pad');
  });
});
