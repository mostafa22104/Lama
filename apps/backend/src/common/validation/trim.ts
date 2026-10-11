/** class-transformer helper: trims strings, leaves other values alone. */
export const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
