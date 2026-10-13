import React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import type { ThemeColors } from '@lamma/shared';
import { makeStyles, useTheme } from '../../theme';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'whatsapp' | 'outline' | 'danger' | 'ghost';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: 'large' | 'medium';
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
}

const LOOK: Record<ButtonVariant, { bg: keyof ThemeColors | null; fg: keyof ThemeColors; border: keyof ThemeColors | null }> = {
  primary: { bg: 'primary', fg: 'onPrimary', border: null },
  whatsapp: { bg: 'whatsapp', fg: 'onPrimary', border: null },
  outline: { bg: 'surface', fg: 'primaryInk', border: 'primary' },
  danger: { bg: 'surface', fg: 'danger', border: 'danger' },
  ghost: { bg: null, fg: 'primaryInk', border: null },
};

export function Button({ label, onPress, variant = 'primary', size = 'large', icon, loading, disabled, testID }: ButtonProps) {
  const styles = useStyles();
  const { colors, sizes } = useTheme();
  const inactive = disabled || loading;
  const look = disabled ? { bg: 'disabledBg' as const, fg: 'muted' as const, border: null } : LOOK[variant];
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { height: size === 'large' ? sizes.buttonPrimary : sizes.buttonSecondary },
        look.bg ? { backgroundColor: colors[look.bg] } : null,
        look.border ? { borderWidth: 1.5, borderColor: colors[look.border] } : null,
        pressed ? styles.pressed : null,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors[look.fg]} />
      ) : (
        <View style={styles.row}>
          {icon ? <Icon name={icon} color={look.fg} size={22} /> : null}
          <Text variant="section" color={look.fg}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  base: { borderRadius: t.radius.button, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pressed: { opacity: 0.85 },
}));
