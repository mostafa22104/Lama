import { IsString, validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { IsOptionalNotNull } from './optional-not-null.js';

class Sample {
  @IsOptionalNotNull()
  @IsString()
  name?: string;
}

async function errorsFor(value: unknown) {
  const sample = new Sample();
  Object.assign(sample, { name: value });
  return validate(sample);
}

describe('IsOptionalNotNull', () => {
  it('accepts undefined', async () => {
    expect(await errorsFor(undefined)).toEqual([]);
  });

  it('rejects null on that field', async () => {
    const errors = await errorsFor(null);
    expect(errors.map((e) => e.property)).toEqual(['name']);
  });

  it('accepts a valid value', async () => {
    expect(await errorsFor('x')).toEqual([]);
  });
});
