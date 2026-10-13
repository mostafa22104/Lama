import React from 'react';
import { screen, userEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../../../testing/render';
import { Button } from '../index';

describe('Button', () => {
  it('is an accessible 56px button that calls onPress', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<Button label="كمّل" onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'كمّل' });
    await userEvent.setup().press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire while loading or disabled', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<Button label="ابعت" onPress={onPress} loading />);
    await userEvent.setup().press(screen.getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByRole('button')).toBeBusy();
  });
});
