import React from 'react';
import { View } from 'react-native';
import { AmountText, Badge, Card, CustomerRow, EmptyState, ProgressBar, Skeleton, StatusChip } from '../../../shared/components';

export function GalleryData() {
  return (
    <Card>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <StatusChip status="paid" />
        <StatusChip status="due_soon" />
        <StatusChip status="overdue" />
        <StatusChip status="awaiting_confirmation" />
        <Badge count={3} />
      </View>
      <AmountText amount={23400} size="large" color="primaryInk" />
      <AmountText amount={2850} size="medium" color="danger" />
      <ProgressBar value={0.74} />
      <CustomerRow name="محمود حسن" subtitle="اشتراك سبتمبر · متأخر 3 أيام" amount={450} status="overdue" />
      <CustomerRow name="سارة عادل" subtitle="اشتراك شهري · 26 في الشهر" amount={450} status="due_soon" />
      <CustomerRow name="أحمد السيد" subtitle="اشتراك شهري · ولدين" amount={600} status="awaiting_confirmation" />
      <Skeleton width="100%" height={18} />
      <EmptyState icon="bell" title="مفيش تذكيرات النهارده" message="كل العملاء دافعين" />
    </Card>
  );
}
