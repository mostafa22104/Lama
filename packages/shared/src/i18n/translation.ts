/** Same keys as T, every leaf a string. Lets other locales mirror the Arabic source. */
export type TranslationShape<T> = {
  readonly [K in keyof T]: T[K] extends string ? string : TranslationShape<T[K]>;
};
