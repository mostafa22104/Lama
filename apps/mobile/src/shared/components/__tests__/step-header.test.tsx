import React from 'react';
import { screen, userEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../../../testing/render';
import { StepHeader } from '../index';

describe('StepHeader', () => {
  it('shows the title, step text and a back button', async () => {
    const onBack = jest.fn();
    await renderWithProviders(<StepHeader title="حساب جديد" step={1} total={4} onBack={onBack} />);
    expect(screen.getByRole('header', { name: 'حساب جديد' })).toBeTruthy();
    expect(screen.getByText('خطوة 1 من 4')).toBeTruthy();
    await userEvent.setup().press(screen.getByRole('button'));
    expect(onBack).toHaveBeenCalled();
  });

  it('hides the back button without onBack', async () => {
    await renderWithProviders(<StepHeader title="دخول" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
