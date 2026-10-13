import React from 'react';
import { View } from 'react-native';
import { makeStyles } from '../../theme';

export function ProgressBar({ value }: { value: number }) {
  const styles = useStyles();
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <View accessible accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: percent }} style={styles.track}>
      <View style={[styles.fill, { width: `${percent}%` }]} />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  track: { height: 14, borderRadius: 7, backgroundColor: t.colors.disabledBg, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 7, backgroundColor: t.colors.primary },
}));
