import { describe, expect, it } from 'vitest';
import { buildReminderMessage, payLink, whatsappUrl } from './reminderMessage.js';

const base = {
  locale: 'ar' as const,
  customerName: 'سارة',
  businessName: 'أكاديمية النجوم للكرة',
  title: 'اشتراك سبتمبر',
  amount: 450,
  link: 'https://lamma.app/p/abc',
};

describe('buildReminderMessage', () => {
  it('matches the design copy 3 days before, for a woman', () => {
    expect(buildReminderMessage({ ...base, gender: 'female', daysUntilDue: 3 })).toBe(
      'أهلاً أستاذة سارة،\nفاضل 3 أيام على ميعاد اشتراك سبتمبر في أكاديمية النجوم للكرة: 450 ج.م\n' +
        'تقدري تدفعي من هنا في دقيقة:\nhttps://lamma.app/p/abc',
    );
  });

  it('uses the due-day copy for a man', () => {
    expect(buildReminderMessage({ ...base, customerName: 'محمود', gender: 'male', daysUntilDue: 0 })).toBe(
      'أهلاً أستاذ محمود،\nالنهارده ميعاد اشتراك سبتمبر في أكاديمية النجوم للكرة: 450 ج.م\n' +
        'ادفع من هنا:\nhttps://lamma.app/p/abc',
    );
  });

  it('uses neutral late copy with correct Arabic day counts', () => {
    const late = (days: number) =>
      buildReminderMessage({ ...base, customerName: 'كريم', gender: null, daysUntilDue: -days });
    expect(late(3)).toBe(
      'أهلاً كريم،\nاشتراك سبتمبر (450 ج.م) عدّى ميعاده بـ 3 أيام.\n' +
        'لو الدفع تم خلاص، ابعت صورة التحويل من اللينك ده:\nhttps://lamma.app/p/abc',
    );
    expect(late(1)).toContain('عدّى ميعاده بـ يوم.');
    expect(late(2)).toContain('عدّى ميعاده بـ يومين.');
    expect(late(22)).toContain('عدّى ميعاده بـ 22 يوم.');
  });

  it('formats large amounts with Western digits', () => {
    const text = buildReminderMessage({ ...base, gender: 'female', amount: 1200, daysUntilDue: 3 });
    expect(text).toContain('1,200 ج.م');
  });

  it('has English copy', () => {
    const text = buildReminderMessage({ ...base, locale: 'en', customerName: 'Sara', gender: 'female', daysUntilDue: 1 });
    expect(text).toBe(
      'Hi Sara,\nاشتراك سبتمبر at أكاديمية النجوم للكرة (450 EGP) is due in 1 day.\nPay here in a minute:\nhttps://lamma.app/p/abc',
    );
  });
});

describe('links', () => {
  it('builds wa.me links without the plus and with encoded text', () => {
    expect(whatsappUrl('+201012345678', 'أهلاً\nيا سارة')).toBe(
      `https://wa.me/201012345678?text=${encodeURIComponent('أهلاً\nيا سارة')}`,
    );
  });

  it('builds pay links without a double slash', () => {
    expect(payLink('https://lamma.app/', 'tok')).toBe('https://lamma.app/p/tok');
    expect(payLink('http://localhost:3001', 'tok')).toBe('http://localhost:3001/p/tok');
  });
});
