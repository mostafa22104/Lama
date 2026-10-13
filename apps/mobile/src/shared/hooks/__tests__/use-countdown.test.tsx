import { act, renderHook } from '@testing-library/react-native';
import { useCountdown } from '../use-countdown';

describe('useCountdown', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('counts down to zero and restarts', async () => {
    const { result } = await renderHook(() => useCountdown(3));
    expect(result.current.remaining).toBe(3);
    await act(async () => jest.advanceTimersByTime(3_000));
    expect(result.current.remaining).toBe(0);
    await act(async () => result.current.restart());
    expect(result.current.remaining).toBe(3);
  });
});
