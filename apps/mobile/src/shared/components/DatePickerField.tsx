import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { makeStyles } from '../../theme';
import { CalendarModal } from './CalendarModal';
import { Icon } from './Icon';
import { Text } from './Text';

interface DatePickerFieldProps {
  label: string;
  value: string;
  onChange: (isoDate: string) => void;
  hint?: string;
}

const AR_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

function formatDisplayDate(isoDate: string): string {
  if (!isoDate || isoDate.length < 10) return isoDate;
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  return `${d} ${AR_MONTHS[m - 1]} ${y}`;
}

export function DatePickerField({ label, value, onChange, hint }: DatePickerFieldProps) {
  const styles = useStyles();
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text weight={600}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => setModalVisible(true)}
        style={styles.box}
      >
        <View style={styles.iconBox}>
          <Icon name="calendar" size={18} color="primary" />
        </View>
        <Text variant="body" weight={600} style={styles.valueText}>
          {formatDisplayDate(value)}
        </Text>
      </Pressable>
      {hint ? <Text variant="caption" color="muted">{hint}</Text> : null}

      <CalendarModal
        visible={modalVisible}
        initialDate={value}
        onClose={() => setModalVisible(false)}
        onSelect={onChange}
      />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { gap: 8 },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: t.sizes.input,
    borderRadius: t.radius.input,
    borderWidth: 1.5,
    borderColor: t.colors.inputBorder,
    backgroundColor: t.colors.surface,
    paddingHorizontal: 14,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: t.colors.chatBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: { flex: 1 },
}));
