import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../theme';
import { Text } from './Text';

/** Initial letter on a tint picked from the name, so a customer keeps the same color. */
export function Avatar({ name, size }: { name: string; size?: number }) {
  const { colors, status, sizes } = useTheme();
  const tints = [
    { bg: colors.primarySoft, fg: colors.primaryInk },
    { bg: colors.goldSoft, fg: colors.gold },
    { bg: status.awaiting.bg, fg: status.awaiting.fg },
    { bg: status.overdue.bg, fg: status.overdue.fg },
  ];
  const hash = [...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const tint = tints[hash % tints.length];
  const side = size ?? sizes.avatar + 8;
  return (
    <View style={{ width: side, height: side, borderRadius: side / 2, backgroundColor: tint.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text variant="section" style={{ color: tint.fg }}>{Array.from(name.trim())[0] ?? ''}</Text>
    </View>
  );
}
