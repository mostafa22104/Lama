import React, { type ComponentRef, useRef } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { toWesternDigits } from '@lamma/shared';
import { useTranslation } from 'react-i18next';
import { makeStyles } from '../../theme';
import { Text } from './Text';

const LENGTH = 6;

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete: (code: string) => void;
  error?: boolean;
  autoFocus?: boolean;
}

/**
 * Pasting a whole SMS works: the first standalone 6-digit run wins; otherwise
 * digits only (Arabic-Indic included), max 6.
 */
export function normalizeOtp(raw: string): string {
  const text = toWesternDigits(raw.replace(/[‎‏‪-‮⁦-⁩]/g, ''));
  const run = text.match(/(?<!\d)\d{6}(?!\d)/);
  return run ? run[0] : text.replace(/\D/g, '').slice(0, LENGTH);
}

export function OtpInput({ value, onChange, onComplete, error, autoFocus = true }: OtpInputProps) {
  const styles = useStyles();
  const { t } = useTranslation();
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const handleChange = (raw: string) => {
    const next = normalizeOtp(raw);
    onChange(next);
    if (next.length === LENGTH && next !== value) onComplete(next);
  };
  return (
    <Pressable onPress={() => input.current?.focus()} style={styles.row}>
      {Array.from({ length: LENGTH }, (_, i) => (
        <View key={i} testID={`otp-box-${i}`} style={[styles.box, value.length === i ? styles.active : null, error ? styles.error : null]}>
          <Text variant="screenTitle" ltr>{value[i] ?? ''}</Text>
        </View>
      ))}
      <TextInput
        ref={input}
        accessibilityLabel={t('auth:otpLabel')}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        autoFocus={autoFocus}
        maxLength={64}
        style={styles.hidden}
      />
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', direction: 'ltr', justifyContent: 'space-between', gap: 8 },
  box: {
    flex: 1, height: t.sizes.input, borderRadius: t.radius.input, borderWidth: 1.5,
    borderColor: t.colors.inputBorder, backgroundColor: t.colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  active: { borderColor: t.colors.primary, borderWidth: 2 },
  error: { borderColor: t.colors.danger },
  hidden: { position: 'absolute', opacity: 0, width: 1, height: 1 },
}));
