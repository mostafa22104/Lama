import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import type { ChargeDto, ChargeUpdate } from '@lamma/shared';
import { AmountInput, Button, Icon, Text, TextField, Toggle } from '../../../shared/components';
import { makeStyles } from '../../../theme';

interface Props {
  visible: boolean;
  charge: ChargeDto;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (patch: ChargeUpdate) => void;
}

export function EditChargeModal({ visible, charge, isPending, onClose, onSubmit }: Props) {
  const styles = useStyles();
  const [title, setTitle] = useState(charge.title);
  const [amountStr, setAmountStr] = useState(String(charge.amount));
  const [active, setActive] = useState(charge.active);

  useEffect(() => {
    if (visible) {
      setTitle(charge.title);
      setAmountStr(String(charge.amount));
      setActive(charge.active);
    }
  }, [visible, charge]);

  const amountNum = parseInt(amountStr, 10);
  const isValid = title.trim().length > 0 && !isNaN(amountNum) && amountNum > 0;

  const handleSave = () => {
    if (!isValid) return;
    onSubmit({
      title: title.trim(),
      amount: amountNum,
      active,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text variant="section" weight={700}>تعديل بيانات الاشتراك</Text>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={20} color="muted" />
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <TextField
              label="اسم الاشتراك"
              value={title}
              onChangeText={setTitle}
              placeholder="مثلاً: اشتراك شهري"
            />

            <AmountInput
              label="المبلغ"
              value={amountStr}
              onChangeText={setAmountStr}
            />

            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text variant="body" weight={600}>حالة الاشتراك</Text>
                <Text variant="caption" color="muted">
                  {active ? 'الاشتراك مفعّل ومتاح للعملاء' : 'الاشتراك موقوف مؤقتاً'}
                </Text>
              </View>
              <Toggle value={active} onChange={setActive} label="حالة الاشتراك" />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Button
              label="حفظ التعديلات"
              disabled={!isValid || isPending}
              loading={isPending}
              onPress={handleSave}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const useStyles = makeStyles((t) => ({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '85%', backgroundColor: t.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.chatBg },
  scroll: { maxHeight: 360 },
  scrollContent: { gap: 14, paddingBottom: 8 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: t.colors.line },
  toggleInfo: { flex: 1, gap: 2 },
  footer: { paddingTop: 6 },
}));
