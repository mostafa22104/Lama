export const FONT_FAMILY = 'IBM Plex Sans Arabic';
export const FONT_WEIGHTS = [400, 500, 600, 700] as const;
export type FontWeight = (typeof FONT_WEIGHTS)[number];

export const TYPE_SCALE = {
  display: { size: 38, weight: 700, lineHeight: 1.35 },
  screenTitle: { size: 22, weight: 700, lineHeight: 1.3 },
  section: { size: 18, weight: 700, lineHeight: 1.4 },
  body: { size: 16, weight: 400, lineHeight: 1.7 },
  caption: { size: 13, weight: 500, lineHeight: 1.5 },
} as const;

export type TypeVariant = keyof typeof TYPE_SCALE;
