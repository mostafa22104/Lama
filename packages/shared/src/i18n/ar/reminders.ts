/** WhatsApp reminder copy (from lamma-design-handoff ReminderSettings). {placeholders} are filled by buildReminderMessage. */
export const arReminders = {
  greeting: { female: 'أهلاً أستاذة {name}،', male: 'أهلاً أستاذ {name}،', neutral: 'أهلاً {name}،' },
  before: 'فاضل {days} على ميعاد {title} في {business}: {amount} {currency}',
  onDue: 'النهارده ميعاد {title} في {business}: {amount} {currency}',
  after: '{title} ({amount} {currency}) عدّى ميعاده بـ {days}.',
  payCta: {
    female: 'تقدري تدفعي من هنا في دقيقة:',
    male: 'تقدر تدفع من هنا في دقيقة:',
    neutral: 'الدفع من هنا في دقيقة:',
  },
  onDueCta: { female: 'ادفعي من هنا:', male: 'ادفع من هنا:', neutral: 'الدفع من هنا:' },
  proofCta: {
    female: 'لو دفعتي خلاص، ابعتي صورة التحويل من اللينك ده:',
    male: 'لو دفعت خلاص، ابعت صورة التحويل من اللينك ده:',
    neutral: 'لو الدفع تم خلاص، ابعت صورة التحويل من اللينك ده:',
  },
  days: { one: 'يوم', two: 'يومين', few: '{n} أيام', many: '{n} يوم' },
} as const;
