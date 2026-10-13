import type { FontWeight } from '@lamma/shared';

/** Android picks a font by file name, so each weight is its own family. */
export const FONTS: Record<FontWeight, string> = {
  400: 'IBMPlexSansArabic-Regular',
  500: 'IBMPlexSansArabic-Medium',
  600: 'IBMPlexSansArabic-SemiBold',
  700: 'IBMPlexSansArabic-Bold',
};
