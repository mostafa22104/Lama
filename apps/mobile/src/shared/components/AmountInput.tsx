import React from 'react';
import { CURRENCY_LABEL } from '@lamma/shared';
import { useLanguageStore } from '../../i18n';
import { TextField, type TextFieldProps } from './TextField';

export function AmountInput(props: Omit<TextFieldProps, 'keyboardType' | 'suffix' | 'ltr'>) {
  const language = useLanguageStore((state) => state.language);
  return <TextField {...props} keyboardType="number-pad" suffix={CURRENCY_LABEL[language]} ltr />;
}
