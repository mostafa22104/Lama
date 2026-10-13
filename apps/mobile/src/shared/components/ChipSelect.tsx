import React from 'react';
import { Pressable, View } from 'react-native';
import { makeStyles } from '../../theme';
import { Text } from './Text';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface ChipSelectProps<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  columns?: number;
}

export function ChipSelect<T extends string>({ options, value, onChange, columns = 3 }: ChipSelectProps<T>) {
  const styles = useStyles();
  const width = `${100 / columns - 3}%` as const;
  return (
    <View style={styles.grid} accessibilityRole="radiogroup">
      {options.map((option) => {
        const checked = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ checked }}
            onPress={() => onChange(option.value)}
            style={[styles.chip, { width }, checked ? styles.checked : null]}
          >
            <Text weight={600} color={checked ? 'onPrimary' : 'ink'}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    height: t.sizes.buttonSecondary, borderRadius: t.radius.button, borderWidth: 1.5,
    borderColor: t.colors.inputBorder, backgroundColor: t.colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  checked: { backgroundColor: t.colors.primary, borderColor: t.colors.primary },
}));
