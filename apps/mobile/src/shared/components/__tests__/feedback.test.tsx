import React from 'react';
import { screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../../testing/render';
import { Badge, Button, EmptyState, ProgressBar, Skeleton } from '../index';

describe('feedback components', () => {
  it('Badge hides at zero and caps at 9+', async () => {
    await renderWithProviders(
      <>
        <Badge count={0} />
        <Badge count={3} />
        <Badge count={12} />
      </>,
    );
    expect(screen.queryByText('0')).toBeNull();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('9+')).toBeTruthy();
  });

  it('ProgressBar reports its value', async () => {
    await renderWithProviders(<ProgressBar value={0.74} />);
    expect(screen.getByRole('progressbar').props.accessibilityValue).toEqual({ min: 0, max: 100, now: 74 });
  });

  it('EmptyState shows title, message and action', async () => {
    await renderWithProviders(
      <EmptyState icon="users" title="لسه مفيش عملاء" message="ضيف أول عميل" action={<Button label="ضيف" onPress={() => {}} />} />,
    );
    expect(screen.getByText('لسه مفيش عملاء')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'ضيف' })).toBeTruthy();
  });

  it('Skeleton renders', async () => {
    await renderWithProviders(<Skeleton width={120} height={16} />);
    expect(screen.getByTestId('skeleton')).toBeTruthy();
  });
});
