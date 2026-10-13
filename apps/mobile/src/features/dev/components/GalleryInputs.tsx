import React, { useState } from 'react';
import { AmountInput, Button, Card, ChipSelect, OtpInput, PhoneInput, StepHeader, TextField, Toggle } from '../../../shared/components';

export function GalleryInputs() {
  const [otp, setOtp] = useState('');
  const [type, setType] = useState<'academy' | 'tutor' | 'other'>('academy');
  const [on, setOn] = useState(true);
  return (
    <Card>
      <StepHeader title="حساب جديد" step={1} total={4} onBack={() => {}} />
      <Button label="دفعت" icon="check" onPress={() => {}} />
      <Button label="ابعت على واتساب" variant="whatsapp" icon="whatsapp" onPress={() => {}} />
      <Button label="هدفع يوم…" variant="outline" icon="calendar" onPress={() => {}} />
      <Button label="رفض" variant="danger" icon="close" onPress={() => {}} />
      <Button label="ابعت الإثبات" disabled onPress={() => {}} />
      <TextField label="اسم النشاط" defaultValue="أكاديمية النجوم للكرة" />
      <PhoneInput label="رقم الموبايل" defaultValue="010 1234 5678" />
      <AmountInput label="المبلغ" defaultValue="450" />
      <TextField label="خانة بخطأ" error="الخانة دي مطلوبة" />
      <OtpInput value={otp} onChange={setOtp} onComplete={() => {}} autoFocus={false} />
      <ChipSelect
        options={[{ value: 'academy', label: 'أكاديمية' }, { value: 'tutor', label: 'مدرّس' }, { value: 'other', label: 'حاجة تانية' }]}
        value={type}
        onChange={setType}
      />
      <Toggle label="toggle" value={on} onChange={setOn} />
    </Card>
  );
}
