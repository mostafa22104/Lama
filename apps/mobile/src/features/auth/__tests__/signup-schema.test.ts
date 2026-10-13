import { signupSchema } from '../schemas/signup-schema';

const valid = { channel: 'phone', contact: '٠١٠ ١٢٣٤ ٥٦٧٨', businessName: 'أكاديمية النجوم', businessType: 'academy', instapayAddress: 'nogoum@instapay' };

describe('signupSchema', () => {
  it('accepts an Arabic-digit Egyptian mobile', () => {
    expect(signupSchema.safeParse(valid).success).toBe(true);
  });

  it('flags a bad phone, a bad email and empty fields with translation keys', () => {
    const issues = (input: object) =>
      (signupSchema.safeParse({ ...valid, ...input }).error?.issues ?? []).map((i) => [i.path.join('.'), i.message]);
    expect(issues({ contact: '0123' })).toEqual([['contact', 'auth:invalidPhone']]);
    expect(issues({ channel: 'email', contact: 'nope' })).toEqual([['contact', 'auth:invalidEmail']]);
    expect(issues({ businessName: ' ' })).toEqual([['businessName', 'auth:required']]);
  });
});
