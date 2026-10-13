export const arCommon = {
  appName: 'لَمّة',
  currency: 'ج.م',
  network: 'مفيش إنترنت، جرّب تاني',
  retry: 'جرّب تاني',
  offlineTitle: 'مفيش إنترنت',
  comingSoon: 'الصفحة دي جاية قريب',
  tabs: { home: 'الرئيسية', customers: 'العملاء', confirmations: 'التأكيدات', reports: 'التقارير' },
  status: {
    paid: 'مدفوع',
    due_soon: 'مستحق قريب',
    overdue: 'متأخر',
    awaiting_confirmation: 'في انتظار التأكيد',
    upcoming: 'مستحق',
  },
  businessType: {
    academy: 'أكاديمية',
    building: 'عمارة',
    tutor: 'مدرّس',
    nursery: 'حضانة',
    other: 'حاجة تانية',
  },
  months: [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
  ],
} as const;
