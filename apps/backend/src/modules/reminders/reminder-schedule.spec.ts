import { describe, expect, it } from 'vitest';
import { reminderKindForToday } from './reminder-schedule.js';

const rule = { beforeDays: 3, onDueDate: true, afterDays: 3 };
const today = '2026-09-23';
const kind = (dueDate: string, extra: Partial<{ promisedDate: string | null; status: 'overdue' | 'due_soon' | 'upcoming' | 'paid' | 'awaiting_confirmation' }> = {}) =>
  reminderKindForToday({ dueDate, promisedDate: null, status: 'due_soon', ...extra }, rule, today);

describe('reminderKindForToday', () => {
  it('fires exactly on the rule offsets', () => {
    expect(kind('2026-09-26')).toBe('before');
    expect(kind('2026-09-23')).toBe('on_due');
    expect(kind('2026-09-20', { status: 'overdue' })).toBe('after');
    expect(kind('2026-09-25')).toBeNull();
    expect(kind('2026-09-01', { status: 'overdue' })).toBeNull();
  });

  it('fires on a promised date, before the other rules', () => {
    expect(kind('2026-09-10', { status: 'overdue', promisedDate: today })).toBe('promise');
  });

  it('never fires for paid or awaiting invoices', () => {
    expect(kind('2026-09-26', { status: 'paid' })).toBeNull();
    expect(kind('2026-09-20', { status: 'awaiting_confirmation' })).toBeNull();
  });

  it('respects disabled rules', () => {
    const off = { beforeDays: null, onDueDate: false, afterDays: null };
    expect(reminderKindForToday({ dueDate: '2026-09-26', promisedDate: null, status: 'due_soon' }, off, today)).toBeNull();
    expect(reminderKindForToday({ dueDate: '2026-09-23', promisedDate: null, status: 'due_soon' }, off, today)).toBeNull();
  });
});
