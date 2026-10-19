import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '../../../shared/components';
import { makeStyles } from '../../../theme';

const DAYS = [1, 5, 10, 15, 20, 25];

interface DueDaySelectorProps {
  value: number;
  onChange: (day: number) => void;
}

export function DueDaySelector({ value, onChange }: DueDaySelectorProps) {
  const styles = useStyles();

  return (
    <View style={styles.daysRow}>
      {DAYS.map((d) => (
        <Pressable
          key={d}
          accessibilityRole="button"
          onPress={() => onChange(d)}
          style={[styles.dayPill, value === d ? styles.dayPillActive : undefined]}
        >
          <Text variant="body" weight={700} color={value === d ? 'onPrimary' : 'ink'}>
            {d}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  daysRow: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  dayPill: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: t.colors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.colors.surface,
  },
  dayPillActive: {
    backgroundColor: t.colors.primary,
    borderColor: t.colors.primary,
  },
}));
