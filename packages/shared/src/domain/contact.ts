export const CONTACT_CHANNELS = ['phone', 'email'] as const;
export type ContactChannel = (typeof CONTACT_CHANNELS)[number];

const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';
const PERSIAN = '۰۱۲۳۴۵۶۷۸۹';
const EGYPTIAN_MOBILE = /^1[0125]\d{8}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function toWesternDigits(value: string): string {
  return value.replace(/[٠-٩۰-۹]/g, (digit) => {
    const index = ARABIC_INDIC.indexOf(digit);
    return String(index >= 0 ? index : PERSIAN.indexOf(digit));
  });
}

/** Strips Unicode bidi/format marks (pasted from WhatsApp/Arabic UIs) and whitespace. */
export function stripFormatting(value: string): string {
  return value.replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069\s]/g, '');
}

/** Returns the number in E.164 form (+20…) or null when it is not an Egyptian mobile. */
export function normalizeEgyptianPhone(raw: string): string | null {
  let digits = stripFormatting(toWesternDigits(raw)).replace(/[-()./]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);

  if (digits.startsWith('0020')) digits = digits.slice(4);
  else if (digits.startsWith('20')) digits = digits.slice(2);
  else if (digits.startsWith('0')) digits = digits.slice(1);

  // Trunk zero kept after the country code, e.g. +20 010 1234 5678.
  if (digits.length === 11 && digits.startsWith('01')) digits = digits.slice(1);

  return EGYPTIAN_MOBILE.test(digits) ? `+20${digits}` : null;
}

export function normalizeEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  return EMAIL.test(email) ? email : null;
}

export function normalizeContact(channel: ContactChannel, raw: string): string | null {
  return channel === 'phone' ? normalizeEgyptianPhone(raw) : normalizeEmail(raw);
}
