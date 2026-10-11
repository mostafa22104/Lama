import { Clock } from '../common/clock/clock.js';

/** Wednesday 23 Sept 2026, 12:00 Cairo — the date shown in the Reminders design. */
export const DEFAULT_TEST_NOW = '2026-09-23T09:00:00.000Z';

export class FixedClock extends Clock {
  private current = new Date(DEFAULT_TEST_NOW);

  now(): Date {
    return new Date(this.current);
  }

  set(iso: string): void {
    this.current = new Date(iso);
  }
}
