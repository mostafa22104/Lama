import React from 'react';
import { TextField, type TextFieldProps } from './TextField';

/** Egyptian mobile entry: phone keypad, left-to-right digits. Normalization happens on submit. */
export function PhoneInput(props: Omit<TextFieldProps, 'keyboardType' | 'ltr'>) {
  return <TextField {...props} keyboardType="phone-pad" textContentType="telephoneNumber" autoComplete="tel" ltr />;
}
