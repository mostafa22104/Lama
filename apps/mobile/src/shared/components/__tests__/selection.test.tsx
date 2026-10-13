import React from 'react';
import { screen, userEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../../../testing/render';
import { ChipSelect, SegmentedControl } from '../index';

describe('selection controls', () => {
  it('SegmentedControl marks the selected tab and reports changes', async () => {
    const onChange = jest.fn();
    await renderWithProviders(
      <SegmentedControl options={[{ value: 'phone', label: 'موبايل' }, { value: 'email', label: 'إيميل' }]} value="phone" onChange={onChange} />,
    );
    expect(screen.getByRole('tab', { name: 'موبايل' })).toBeSelected();
    await userEvent.setup().press(screen.getByRole('tab', { name: 'إيميل' }));
    expect(onChange).toHaveBeenCalledWith('email');
  });

  it('ChipSelect works like a radio group', async () => {
    const onChange = jest.fn();
    await renderWithProviders(
      <ChipSelect options={[{ value: 'academy', label: 'أكاديمية' }, { value: 'tutor', label: 'مدرّس' }]} value="academy" onChange={onChange} />,
    );
    expect(screen.getByRole('radio', { name: 'أكاديمية' })).toBeChecked();
    await userEvent.setup().press(screen.getByRole('radio', { name: 'مدرّس' }));
    expect(onChange).toHaveBeenCalledWith('tutor');
  });
});
