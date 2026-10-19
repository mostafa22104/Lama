export interface MockCustomerDef {
  name: string;
  phone: string;
  gender: 'male' | 'female';
  note: string;
}

export interface MockChargeDef {
  title: string;
  kind: 'monthly' | 'one_time';
  amount: number;
  dayOfMonth?: number;
  dueDate?: string;
  billingFrom: string;
}

export const MOCK_BUSINESS = {
  name: 'أكاديمية النجوم للكرة',
  type: 'academy' as const,
  instapayAddress: 'nogoum.academy@instapay',
  phone: '+201012345678',
  email: 'captain.walid@lamma.app',
  plan: 'pro' as const,
  area: 'مدينة نصر، القاهرة',
};

export const MOCK_CHARGES: MockChargeDef[] = [
  {
    title: 'اشتراك شهري أساسي',
    kind: 'monthly',
    amount: 450,
    dayOfMonth: 5,
    billingFrom: '2026-10-01',
  },
  {
    title: 'اشتراك تدريب خاص',
    kind: 'monthly',
    amount: 900,
    dayOfMonth: 5,
    billingFrom: '2026-10-01',
  },
  {
    title: 'كامب الصيف 2026',
    kind: 'one_time',
    amount: 1200,
    dueDate: '2026-10-10',
    billingFrom: '2026-10-01',
  },
  {
    title: 'تيشيرت الأكاديمية',
    kind: 'one_time',
    amount: 150,
    dueDate: '2026-10-10',
    billingFrom: '2026-10-01',
  },
  {
    title: 'اشتراك ناشئين مخفض',
    kind: 'monthly',
    amount: 300,
    dayOfMonth: 5,
    billingFrom: '2026-10-01',
  },
];

export const MOCK_CUSTOMERS: MockCustomerDef[] = [
  { name: 'محمود حسن', phone: '+201011112222', gender: 'male', note: 'ولي أمر يوسف' },
  { name: 'كريم فتحي', phone: '+201022223333', gender: 'male', note: 'ولي أمر مريم وزياد' },
  { name: 'عمر خالد', phone: '+201077778888', gender: 'male', note: 'فريق تحت 16 سنة' },
  { name: 'يوسف رمضان', phone: '+201033334444', gender: 'male', note: 'فريق الناشئين' },
  { name: 'أحمد السيد', phone: '+201066667777', gender: 'male', note: 'ولي أمر طارق' },
  { name: 'دينا أشرف', phone: '+201088889999', gender: 'female', note: 'فريق الجمباز' },
  { name: 'رنا الشريف', phone: '+201012340004', gender: 'female', note: 'ولية أمر ليلى' },
  { name: 'سارة عادل', phone: '+201055556666', gender: 'female', note: 'ولية أمر آدم' },
  { name: 'إسلام فاروق', phone: '+201012340003', gender: 'male', note: 'ولي أمر يحيى' },
  { name: 'نورهان سامي', phone: '+201044445555', gender: 'female', note: 'ولية أمر ياسين' },
  { name: 'ياسمين طارق', phone: '+201012340002', gender: 'female', note: 'ولية أمر حمزة' },
  { name: 'منى إبراهيم', phone: '+201099990000', gender: 'female', note: 'ولية أمر عمر' },
  { name: 'هبة مصطفى', phone: '+201012340001', gender: 'female', note: 'ولية أمر جنى' },
  { name: 'طارق عبد الرحمن', phone: '+201012340011', gender: 'male', note: 'ولي أمر مازن' },
  { name: 'أشرف عبد العزيز', phone: '+201012340012', gender: 'male', note: 'ولي أمر سيف' },
  { name: 'حسام البدري', phone: '+201012340013', gender: 'male', note: 'ولي أمر إياد' },
  { name: 'شريف إكرامي', phone: '+201012340014', gender: 'male', note: 'ولي أمر يونس' },
  { name: 'أحمد فتحي', phone: '+201012340015', gender: 'male', note: 'ولي أمر ملك' },
  { name: 'إبراهيم سعيد', phone: '+201012340016', gender: 'male', note: 'ولي أمر حمزة' },
];
