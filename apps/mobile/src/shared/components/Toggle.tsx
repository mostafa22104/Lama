import React from 'react';
import { Pressable, View } from 'react-native';
import { makeStyles } from '../../theme';

export function Toggle({ value, onChange, label }: { value: boolean; onChange: (value: boolean) => void; label: string }) {
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      hitSlop={8}
      style={[styles.track, value ? styles.on : null]}
    >
      <View style={[styles.knob, value ? styles.knobOn : null]} />
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  track: { width: 52, height: 30, borderRadius: 15, backgroundColor: t.colors.disabledBg, padding: 4, justifyContent: 'center' },
  on: { backgroundColor: t.colors.primary },
  knob: { width: 22, height: 22, borderRadius: 11, backgroundColor: t.colors.surface },
  knobOn: { alignSelf: 'flex-end' },
}));
