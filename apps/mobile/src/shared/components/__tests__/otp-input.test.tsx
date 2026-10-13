import React, { useState } from 'react';
import { screen, userEvent, within } from '@testing-library/react-native';
import { renderWithProviders } from '../../../testing/render';
import { OtpInput } from '../index';

function Harness({ onComplete }: { onComplete: (code: string) => void }) {
  const [value, setValue] = useState('');
  return <OtpInput value={value} onChange={setValue} onComplete={onComplete} />;
}

describe('OtpInput', () => {
  it('accepts Arabic digits, spaces and bidi marks and completes once', async () => {
    const onComplete = jest.fn();
    await renderWithProviders(<Harness onComplete={onComplete} />);
    const input = screen.getByLabelText('otp');
    await userEvent.setup().paste(input, '‎١٢٣ ٤٥٦');
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith('123456');
    const boxes = screen.getAllByTestId(/otp-box-/);
    expect(boxes).toHaveLength(6);
    ['1', '2', '3', '4', '5', '6'].forEach((digit, i) => {
      expect(within(boxes[i]).getByText(digit)).toBeTruthy();
    });
  });

  it('ignores extra characters beyond six digits', async () => {
    const onComplete = jest.fn();
    await renderWithProviders(<Harness onComplete={onComplete} />);
    await userEvent.setup().paste(screen.getByLabelText('otp'), 'Your code: 654321. Thanks 99');
    expect(onComplete).toHaveBeenCalledWith('654321');
  });
});
