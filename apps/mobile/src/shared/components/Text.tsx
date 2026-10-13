import React from 'react';
import { Text as RNText, type TextProps } from 'react-native';
import type { FontWeight, ThemeColors, TypeVariant } from '@lamma/shared';
import { useTheme } from '../../theme';

export interface AppTextProps extends TextProps {
  variant?: TypeVariant;
  color?: keyof ThemeColors;
  weight?: FontWeight;
  align?: 'start' | 'center' | 'end';
  /** Phone numbers, codes, InstaPay addresses: always left-to-right. */
  ltr?: boolean;
}

// RN swaps left/right under RTL, so 'left' means "start".
const ALIGN = { start: 'left', center: 'center', end: 'right' } as const;

export function Text({ variant = 'body', color = 'ink', weight, align, ltr, style, ...rest }: AppTextProps) {
  const { colors, type, fonts } = useTheme();
  const scale = type[variant];
  return (
    <RNText
      {...rest}
      style={[
        {
          fontFamily: fonts[weight ?? scale.weight],
          fontSize: scale.size,
          lineHeight: Math.round(scale.size * scale.lineHeight),
          color: colors[color],
        },
        align ? { textAlign: ALIGN[align] } : null,
        ltr ? { writingDirection: 'ltr' } : null,
        style,
      ]}
    />
  );
}
