/** class-transformer helper: trims strings and turns an empty result into null; other values pass through. */
export const trimOrNull = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};
