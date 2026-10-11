import { beforeEach, describe, expect, it } from 'vitest';
import { FakeOtpSender } from '../../../testing/fake-otp-sender.js';
import { InMemoryOtpRepository } from '../../../testing/in-memory-otp.repository.js';
import { testEnv } from '../../../testing/test-env.js';
import type { OtpRepository } from './otp.repository.js';
import { OtpService } from './otp.service.js';

const target = '+201012345678';
const t0 = new Date('2026-09-20T10:00:00Z');
const after = (seconds: number) => new Date(t0.getTime() + seconds * 1000);
const code = (error: string) => expect.objectContaining({ code: error });

describe('OtpService', () => {
  let repo: InMemoryOtpRepository;
  let sender: FakeOtpSender;
  let service: OtpService;

  beforeEach(() => {
    repo = new InMemoryOtpRepository();
    sender = new FakeOtpSender();
    service = new OtpService(repo as unknown as OtpRepository, sender, testEnv());
  });

  it('sends a code and stores only its hash', async () => {
    await service.request('phone', target, t0);
    const sent = sender.lastCodeFor(target);
    expect(sent).toMatch(/^\d{6}$/);
    expect(repo.records[0].codeHash).not.toContain(sent);
  });

  it('accepts the right code and refuses it once consumed', async () => {
    await service.request('phone', target, t0);
    const id = await service.check(target, sender.lastCodeFor(target), after(10));
    await service.consume(id, after(10));
    await expect(service.check(target, sender.lastCodeFor(target), after(11))).rejects.toThrow(
      code('OTP_INVALID'),
    );
    await expect(service.consume(id, after(12))).rejects.toThrow(code('OTP_INVALID'));
  });

  it('rejects a wrong code without consuming the right one', async () => {
    await service.request('phone', target, t0);
    const right = sender.lastCodeFor(target);
    const wrong = right === '000000' ? '111111' : '000000';
    await expect(service.check(target, wrong, after(5))).rejects.toThrow(code('OTP_INVALID'));
    await expect(service.check(target, right, after(6))).resolves.toEqual(expect.any(String));
  });

  it('expires codes after OTP_TTL_SECONDS', async () => {
    await service.request('phone', target, t0);
    await expect(service.check(target, sender.lastCodeFor(target), after(300))).rejects.toThrow(
      code('OTP_EXPIRED'),
    );
  });

  it('locks the code after 5 wrong attempts, even for the right code', async () => {
    await service.request('phone', target, t0);
    const right = sender.lastCodeFor(target);
    const wrong = right === '000000' ? '111111' : '000000';
    for (let i = 0; i < 5; i++) {
      await expect(service.check(target, wrong, after(i + 1))).rejects.toThrow(code('OTP_INVALID'));
    }
    await expect(service.check(target, right, after(10))).rejects.toThrow(
      code('OTP_TOO_MANY_ATTEMPTS'),
    );
  });

  it('does not count correct checks against the attempt limit', async () => {
    await service.request('phone', target, t0);
    const right = sender.lastCodeFor(target);
    const wrong = right === '000000' ? '111111' : '000000';
    for (let i = 0; i < 4; i++) {
      await expect(service.check(target, wrong, after(i + 1))).rejects.toThrow(code('OTP_INVALID'));
    }
    await expect(service.check(target, right, after(10))).resolves.toEqual(expect.any(String));
    await expect(service.check(target, right, after(11))).resolves.toEqual(expect.any(String));
  });

  it('counts concurrent wrong guesses atomically', async () => {
    await service.request('phone', target, t0);
    const right = sender.lastCodeFor(target);
    const wrong = right === '000000' ? '111111' : '000000';
    const results = await Promise.allSettled(
      Array.from({ length: 8 }, () => service.check(target, wrong, after(1))),
    );
    const codes = results.map((r) => (r.status === 'rejected' ? r.reason.code : 'ok'));
    expect(codes.filter((c) => c === 'OTP_INVALID')).toHaveLength(5);
    expect(codes.filter((c) => c === 'OTP_TOO_MANY_ATTEMPTS')).toHaveLength(3);
    await expect(service.check(target, right, after(2))).rejects.toThrow(
      code('OTP_TOO_MANY_ATTEMPTS'),
    );
  });

  it('enforces the resend cooldown and invalidates the previous code', async () => {
    await service.request('phone', target, t0);
    const first = sender.lastCodeFor(target);
    await expect(service.request('phone', target, after(30))).rejects.toThrow(code('OTP_COOLDOWN'));

    await service.request('phone', target, after(60));
    const second = sender.lastCodeFor(target);
    if (first !== second) {
      await expect(service.check(target, first, after(61))).rejects.toThrow(code('OTP_INVALID'));
    }
    await expect(service.check(target, second, after(61))).resolves.toEqual(expect.any(String));
  });

  it('rejects checks when no code was ever requested', async () => {
    await expect(service.check(target, '123456', t0)).rejects.toThrow(code('OTP_INVALID'));
  });
});
