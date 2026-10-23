import React, { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { formatAmount } from '@lamma/shared';
import { makeStyles } from '../../theme';
import { Icon } from './Icon';
import { Text } from './Text';

interface CalendarModalProps {
  visible: boolean;
  initialDate?: string;
  onClose: () => void;
  onSelect: (isoDate: string) => void;
}

const AR_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];
const WEEK_DAYS = ['س', 'ح', 'ن', 'ث', 'ر', 'خ', 'ج'];

export function CalendarModal({ visible, initialDate, onClose, onSelect }: CalendarModalProps) {
  const styles = useStyles();
  const init = initialDate ? new Date(initialDate) : new Date();
  const [year, setYear] = useState(init.getFullYear() || 2026);
  const [month, setMonth] = useState(init.getMonth() || 0);
  const [selected, setSelected] = useState(initialDate || new Date().toISOString().slice(0, 10));

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 1) % 7; // Saturday is 0 in Egypt

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const handlePick = (day: number) => {
    const mStr = String(month + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    const iso = `${year}-${mStr}-${dStr}`;
    setSelected(iso);
    onSelect(iso);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Pressable accessibilityRole="button" onPress={prevMonth} style={styles.arrowBtn}>
              <Icon name="chevronForward" size={20} color="ink" />
            </Pressable>
            <Text variant="body" weight={700}>
              {`${AR_MONTHS[month]} ${formatAmount(year)}`}
            </Text>
            <Pressable accessibilityRole="button" onPress={nextMonth} style={styles.arrowBtn}>
              <Icon name="chevronBack" size={20} color="ink" />
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {WEEK_DAYS.map((w, i) => (
              <View key={i} style={styles.cell}>
                <Text variant="caption" weight={700} color="muted">{w}</Text>
              </View>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <View key={`empty-${i}`} style={styles.cell} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const mStr = String(month + 1).padStart(2, '0');
              const dStr = String(day).padStart(2, '0');
              const iso = `${year}-${mStr}-${dStr}`;
              const isSel = iso === selected;
              return (
                <Pressable
                  key={iso}
                  accessibilityRole="button"
                  onPress={() => handlePick(day)}
                  style={[styles.cell, styles.dayCell, isSel ? styles.dayCellSelected : undefined]}
                >
                  <Text variant="body" weight={isSel ? 700 : 500} color={isSel ? 'onPrimary' : 'ink'}>
                    {day}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeBtn}>
            <Text variant="caption" weight={700} color="primary">إغلاق</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const useStyles = makeStyles((t) => ({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 360, backgroundColor: t.colors.surface, borderRadius: 20, padding: 18, gap: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  arrowBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.chatBg },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: t.colors.line, paddingBottom: 6 },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%', height: 40, alignItems: 'center', justifyContent: 'center' },
  dayCell: { borderRadius: 10 },
  dayCellSelected: { backgroundColor: t.colors.primary },
  closeBtn: { alignSelf: 'center', paddingVertical: 6, paddingHorizontal: 16 },
}));
