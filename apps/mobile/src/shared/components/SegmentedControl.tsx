import React from 'react';
import { Pressable, View } from 'react-native';
import { makeStyles } from '../../theme';
import { Text } from './Text';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}

export function SegmentedControl<T extends string>({ options, value, onChange, disabled }: SegmentedControlProps<T>) {
  const styles = useStyles();
  return (
    <View style={styles.track} accessibilityRole="tablist">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityLabel={option.label}
            accessibilityState={{ selected, disabled: !!disabled }}
            disabled={disabled}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected ? styles.selected : null]}
          >
            <Text weight={selected ? 600 : 500} color={selected ? 'primaryInk' : 'muted'}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  track: { flexDirection: 'row', backgroundColor: t.colors.disabledBg, borderRadius: t.radius.button, padding: 4, gap: 4 },
  segment: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: t.radius.button - 4 },
  selected: { backgroundColor: t.colors.surface, elevation: 2 },
}));
