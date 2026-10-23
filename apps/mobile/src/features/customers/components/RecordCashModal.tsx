import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatAmount, invoiceDisplayTitle, type InvoiceSummaryDto } from '@lamma/shared';
import { AmountInput, Button, Card, Icon, Text } from '../../../shared/components';
import { makeStyles } from '../../../theme';

interface Props {
  visible: boolean;
  invoices: InvoiceSummaryDto[];
  isPending: boolean;
  onClose: () => void;
  onSubmit: (invoiceId: string, amount: number) => void;
}

export function RecordCashModal({ visible, invoices, isPending, onClose, onSubmit }: Props) {
  const styles = useStyles();
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState<string>(() => invoices[0]?.id ?? '');
  const [amountStr, setAmountStr] = useState<string>(() => (invoices[0] ? String(invoices[0].amount) : ''));
  const prevVisible = React.useRef(visible);

  useEffect(() => {
    if (visible && !prevVisible.current && invoices.length > 0) {
      setSelectedId(invoices[0].id);
      setAmountStr(String(invoices[0].amount));
    }
    prevVisible.current = visible;
  }, [visible, invoices]);

  const selected = invoices.find((inv) => inv.id === selectedId) ?? invoices[0];
  const enteredAmount = parseInt(amountStr, 10);
  const isValidAmount = !isNaN(enteredAmount) && enteredAmount > 0 && selected && enteredAmount <= selected.amount;
  const remaining = selected && isValidAmount ? selected.amount - enteredAmount : 0;

  const handleSelect = (inv: InvoiceSummaryDto) => {
    setSelectedId(inv.id);
    setAmountStr(String(inv.amount));
  };

  const handleConfirm = () => {
    if (!selected || !isValidAmount) return;
    onSubmit(selected.id, enteredAmount);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text variant="section" weight={700}>تسجيل دفع كاش</Text>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={20} color="muted" />
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <Text variant="caption" weight={700} color="muted">اختر الاشتراك المطلوب دفعه:</Text>
            <Card style={styles.invoicesCard}>
              {invoices.map((inv) => {
                const isSel = inv.id === (selected?.id ?? '');
                const title = invoiceDisplayTitle({ title: inv.title, period: inv.period }, 'ar');
                return (
                  <Pressable
                    key={inv.id}
                    testID={`invoice-item-${inv.id}`}
                    accessibilityRole="radio"
                    onPress={() => handleSelect(inv)}
                    style={[styles.invoiceRow, isSel ? styles.invoiceRowSelected : undefined]}
                  >
                    <View style={[styles.radio, isSel ? styles.radioSelected : undefined]}>
                      {isSel ? <View style={styles.radioInner} /> : null}
                    </View>
                    <View style={styles.invInfo}>
                      <Text variant="body" weight={600}>{title}</Text>
                      <Text variant="caption" color="muted">{`مستحق: ${inv.dueDate}`}</Text>
                    </View>
                    <Text variant="body" weight={700} color="primaryInk">
                      {`${formatAmount(inv.amount)} ${t('common:currency')}`}
                    </Text>
                  </Pressable>
                );
              })}
            </Card>

            <View style={styles.amountSection}>
              <AmountInput
                label="المبلغ المدفوع كاش"
                value={amountStr}
                onChangeText={setAmountStr}
                error={
                  enteredAmount > (selected?.amount ?? 0)
                    ? `المبلغ أكبر من المطلوب (${formatAmount(selected?.amount ?? 0)} ${t('common:currency')})`
                    : undefined
                }
              />
              {isValidAmount && remaining > 0 ? (
                <View style={styles.partialBadge}>
                  <Icon name="alert" size={16} color="primary" />
                  <Text variant="caption" color="primary">
                    {`دفعة جزئية: سيتبقى ${formatAmount(remaining)} ${t('common:currency')}`}
                  </Text>
                </View>
              ) : null}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Button
              label={
                isValidAmount
                  ? `تأكيد دفع (${formatAmount(enteredAmount)} ${t('common:currency')})`
                  : 'أدخل مبلغ صالح'
              }
              disabled={!isValidAmount || isPending}
              loading={isPending}
              onPress={handleConfirm}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const useStyles = makeStyles((t) => ({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '85%', backgroundColor: t.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.chatBg },
  scroll: { maxHeight: 360 },
  scrollContent: { gap: 12, paddingBottom: 8 },
  invoicesCard: { padding: 0, overflow: 'hidden' },
  invoiceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: t.colors.line },
  invoiceRowSelected: { backgroundColor: t.colors.bg },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: t.colors.inputBorder, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: t.colors.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: t.colors.primary },
  invInfo: { flex: 1, gap: 2 },
  amountSection: { gap: 6 },
  partialBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: t.colors.chatBg },
  footer: { paddingTop: 8 },
}));
