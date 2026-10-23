import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import type { BusinessDto, BusinessUpdate } from '@lamma/shared';
import { Button, Icon, Text, TextField } from '../../../shared/components';
import { makeStyles } from '../../../theme';

interface Props {
  visible: boolean;
  business: BusinessDto;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (patch: BusinessUpdate) => void;
}

export function EditBusinessModal({ visible, business, isPending, onClose, onSubmit }: Props) {
  const styles = useStyles();
  const [name, setName] = useState(business.name);
  const [phone, setPhone] = useState(business.phone ?? '');
  const [instapayAddress, setInstapayAddress] = useState(business.instapayAddress);

  useEffect(() => {
    if (visible) {
      setName(business.name);
      setPhone(business.phone ?? '');
      setInstapayAddress(business.instapayAddress);
    }
  }, [visible, business]);

  const isValid = name.trim().length > 0 && instapayAddress.trim().length > 0;

  const handleSave = () => {
    if (!isValid) return;
    onSubmit({
      name: name.trim(),
      instapayAddress: instapayAddress.trim(),
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
            <Text variant="section" weight={700}>تعديل بيانات النشاط</Text>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={20} color="muted" />
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <TextField
              label="اسم النشاط"
              value={name}
              onChangeText={setName}
              placeholder="مثلاً: أكاديمية النجوم"
            />
            <TextField
              label="رقم التواصل"
              value={phone}
              onChangeText={setPhone}
              placeholder="01012345678"
              keyboardType="phone-pad"
              ltr
            />
            <TextField
              label="عنوان انستاباي"
              value={instapayAddress}
              onChangeText={setInstapayAddress}
              placeholder="username@instapay"
              ltr
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
