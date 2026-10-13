import React from 'react';
import { TextInput, type TextInputProps, View } from 'react-native';
import { makeStyles, useTheme } from '../../theme';
import { Text } from './Text';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  hint?: string;
  error?: string;
  ltr?: boolean;
  /** Fixed text at the end of the box, e.g. «ج.م». */
  suffix?: string;
}

export function TextField({ label, hint, error, ltr, suffix, ...input }: TextFieldProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <Text weight={600}>{label}</Text>
      <View style={[styles.box, error ? styles.boxError : null]}>
        <TextInput
          {...input}
          accessibilityLabel={label}
          placeholderTextColor={colors.muted}
          style={[styles.input, ltr ? styles.ltr : null]}
        />
        {suffix ? (
          <View style={styles.suffix}>
            <Text color="muted">{suffix}</Text>
          </View>
        ) : null}
      </View>
      {error ? <Text variant="caption" color="danger">{error}</Text> : null}
      {!error && hint ? <Text variant="caption" color="muted">{hint}</Text> : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { gap: 8 },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: t.sizes.input,
    borderRadius: t.radius.input,
    borderWidth: 1.5,
    borderColor: t.colors.inputBorder,
    backgroundColor: t.colors.surface,
  },
  boxError: { borderColor: t.colors.danger },
  input: { flex: 1, paddingHorizontal: 16, fontFamily: t.fonts[400], fontSize: 18, color: t.colors.ink },
  ltr: { writingDirection: 'ltr' },
  suffix: { paddingHorizontal: 16, borderStartWidth: 1, borderStartColor: t.colors.line, alignSelf: 'stretch', justifyContent: 'center' },
}));
