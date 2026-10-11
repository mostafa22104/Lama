import { type AuthResponse, type ContactChannel, normalizeContact } from '@lamma/shared';
import type { TestApp } from './create-test-app.js';

export const OWNER_PHONE = '01012345678';
export const OWNER_PHONE_E164 = '+201012345678';
export const SIGNUP = {
  businessName: 'أكاديمية النجوم للكرة',
  businessType: 'academy',
  instapayAddress: 'nogoum.academy@instapay',
} as const;

export async function requestCode(t: TestApp, contact = OWNER_PHONE, channel: ContactChannel = 'phone') {
  await t.api().post('/api/v1/auth/otp/request').send({ channel, contact }).expect(204);
  const target = normalizeContact(channel, contact);
  if (!target) throw new Error(`Test used an invalid contact: ${contact}`);
  return t.otpSender.lastCodeFor(target);
}

export function verify(t: TestApp, body: Record<string, unknown>) {
  return t.api().post('/api/v1/auth/otp/verify').send({ channel: 'phone', ...body });
}

export async function signUp(t: TestApp, contact = OWNER_PHONE): Promise<AuthResponse> {
  const code = await requestCode(t, contact);
  const res = await verify(t, { contact, code, signup: SIGNUP }).expect(200);
  return res.body as AuthResponse;
}

/** Moves existing codes into the past so a new code can be requested without waiting. */
export async function allowNewCode(t: TestApp): Promise<void> {
  await t.prisma.otpCode.updateMany({ data: { createdAt: new Date(Date.now() - 10 * 60_000) } });
}
