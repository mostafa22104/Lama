import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { Button, Icon, Text, TextField } from '../../../shared/components';
import { makeStyles } from '../../../theme';

interface Props {
  visible: boolean;
  customer: { id: string; name: string; phone: string; note?: string | null };
  isPending: boolean;
  onClose: () => void;
  onSubmit: (patch: { name: string; phone: string; note?: string }) => void;
}

export function EditCustomerModal({ visible, customer, isPending, onClose, onSubmit }: Props) {
  const styles = useStyles();
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone);
  const [note, setNote] = useState(customer.note ?? '');

  useEffect(() => {
    if (visible) {
      setName(customer.name);
      setPhone(customer.phone);
      setNote(customer.note ?? '');
    }
  }, [visible, customer]);

  const isValid = name.trim().length > 0 && phone.trim().length >= 8;

  const handleSave = () => {
    if (!isValid) return;
    onSubmit({
      name: name.trim(),
      phone: phone.trim(),
      note: note.trim() || undefined,
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
            <Text variant="section" weight={700}>تعديل بيانات العميل</Text>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={20} color="muted" />
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <TextField
              label="اسم العميل"
              value={name}
              onChangeText={setName}
              placeholder="مثلاً: كريم فتحي"
            />
            <TextField
              label="رقم الموبايل"
              value={phone}
              onChangeText={setPhone}
              placeholder="01012345678"
              keyboardType="phone-pad"
              ltr
            />
            <TextField
              label="ملاحظات (اختياري)"
              value={note}
              onChangeText={setNote}
              placeholder="مثلاً: ولي أمر مريم وزياد"
            />
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
  scrollContent: { gap: 12, paddingBottom: 8 },
  footer: { paddingTop: 6 },
}));
