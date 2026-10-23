import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Card, Icon, Text } from '../../../shared/components';
import { makeStyles, useTheme } from '../../../theme';
import { useCustomers } from '../../customers';
import { useAssignCustomers } from '../api/use-charges';

interface Props {
  visible: boolean;
  chargeId: string;
  alreadyAssignedIds: string[];
  onClose: () => void;
}

export function AssignCustomersModal({ visible, chargeId, alreadyAssignedIds, onClose }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: allCustomers, isLoading } = useCustomers();
  const assignMutation = useAssignCustomers(chargeId);

  const available = useMemo(() => {
    const list = allCustomers ?? [];
    const unassigned = list.filter((c) => !alreadyAssignedIds.includes(c.id));
    if (!search.trim()) return unassigned;
    const q = search.trim().toLowerCase();
    return unassigned.filter((c) => c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q)));
  }, [allCustomers, alreadyAssignedIds, search]);

  const allSelected = available.length > 0 && selectedIds.length === available.length;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSave = () => {
    if (selectedIds.length === 0) return;
    assignMutation.mutate(selectedIds, {
      onSuccess: () => {
        setSelectedIds([]);
        setSearch('');
        onClose();
      },
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text variant="section">إضافة عملاء للاشتراك</Text>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={20} color="muted" />
            </Pressable>
          </View>

          <View style={styles.searchBar}>
            <Icon name="search" color="muted" size={18} />
            <TextInput
              placeholder="ابحث بالاسم أو الموبايل..."
              placeholderTextColor={colors.muted}
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
            />
          </View>

          <View style={styles.actionRow}>
            <Text variant="caption" color="muted">{`متاح ${available.length} عميل`}</Text>
            {available.length > 0 ? (
              <Pressable accessibilityRole="button" onPress={() => setSelectedIds(allSelected ? [] : available.map((c) => c.id))}>
                <Text variant="caption" weight={700} color="primary">
                  {allSelected ? t('onboarding:deselectAll') : t('onboarding:selectAll')}
                </Text>
              </Pressable>
            ) : null}
          </View>

          <ScrollView style={styles.scrollList} contentContainerStyle={styles.scrollContent}>
            {available.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text variant="body" color="muted" style={styles.centerText}>
                  {isLoading ? 'جاري التحميل...' : 'مفيش عملاء متاحين للإضافة'}
                </Text>
              </View>
            ) : (
              <Card style={styles.listCard}>
                {available.map((c) => {
                  const isSel = selectedIds.includes(c.id);
                  return (
                    <Pressable key={c.id} accessibilityRole="checkbox" onPress={() => toggleSelect(c.id)} style={styles.customerRow}>
                      <View style={[styles.checkbox, isSel ? styles.checkboxChecked : undefined]}>
                        {isSel ? <Icon name="check" size={16} color="onPrimary" /> : null}
                      </View>
                      <View style={styles.customerInfo}>
                        <Text variant="body" weight={600}>{c.name}</Text>
                        {c.phone ? <Text variant="caption" color="muted">{c.phone}</Text> : null}
                      </View>
                    </Pressable>
                  );
                })}
              </Card>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <Button
              label={selectedIds.length === 0 ? 'اختار عملاء' : `إضافة (${selectedIds.length}) عملاء`}
              disabled={selectedIds.length === 0}
              loading={assignMutation.isPending}
              onPress={handleSave}
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
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.chatBg },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, height: 44, borderRadius: 12, backgroundColor: t.colors.chatBg, borderWidth: 1, borderColor: t.colors.line },
  searchInput: { flex: 1, color: t.colors.ink, fontSize: 14, textAlign: 'right' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scrollList: { maxHeight: 320 },
  scrollContent: { paddingBottom: 8 },
  listCard: { padding: 0, overflow: 'hidden' },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: t.colors.line },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: t.colors.inputBorder, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: t.colors.primary, borderColor: t.colors.primary },
  customerInfo: { flex: 1, gap: 2 },
  emptyWrap: { padding: 32, alignItems: 'center' },
  centerText: { textAlign: 'center' },
  footer: { paddingTop: 8 },
}));
