import React from 'react';
import { Pressable, View } from 'react-native';
import type { ChargeCollectionTiming } from '@lamma/shared';
import { Text } from '../../../shared/components';
import { makeStyles } from '../../../theme';

interface Props {
  value: ChargeCollectionTiming;
  onChange: (val: ChargeCollectionTiming) => void;
}

export function CollectionTimingSelector({ value, onChange }: Props) {
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="radio"
        accessibilityState={{ selected: value === 'beginning' }}
        onPress={() => onChange('beginning')}
        style={[styles.option, value === 'beginning' ? styles.optionActive : undefined]}
      >
        <View style={[styles.radio, value === 'beginning' ? styles.radioActive : undefined]}>
          {value === 'beginning' ? <View style={styles.radioDot} /> : null}
        </View>
        <View style={styles.textWrap}>
          <View style={styles.titleRow}>
            <Text variant="body" weight={700}>في بداية المدة</Text>
            <View style={styles.badge}>
              <Text variant="caption" weight={600} color="primary">مقدماً</Text>
            </View>
          </View>
          <Text variant="caption" color="muted">يتم التحصيل مع بداية الاشتراك أو أول الشهر</Text>
        </View>
      </Pressable>

      <Pressable
        accessibilityRole="radio"
        accessibilityState={{ selected: value === 'end' }}
        onPress={() => onChange('end')}
        style={[styles.option, value === 'end' ? styles.optionActive : undefined]}
      >
        <View style={[styles.radio, value === 'end' ? styles.radioActive : undefined]}>
          {value === 'end' ? <View style={styles.radioDot} /> : null}
        </View>
        <View style={styles.textWrap}>
          <View style={styles.titleRow}>
            <Text variant="body" weight={700}>في نهاية المدة</Text>
            <View style={styles.badge}>
              <Text variant="caption" weight={600} color="primary">آجلاً</Text>
            </View>
          </View>
          <Text variant="caption" color="muted">يتم التحصيل عند نهاية دورة الاشتراك أو آخر الشهر</Text>
        </View>
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  container: { gap: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: t.colors.line,
    backgroundColor: t.colors.surface,
  },
  optionActive: {
    borderColor: t.colors.primary,
    backgroundColor: t.colors.chatBg,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: t.colors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: t.colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: t.colors.primary,
  },
  textWrap: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: t.colors.surface,
  },
}));
