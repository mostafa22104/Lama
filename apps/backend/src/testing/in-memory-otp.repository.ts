import type { OtpCode } from '../generated/prisma/client.js';
import type { NewOtp } from '../modules/auth/otp/otp.repository.js';

/** Same contract as OtpRepository, backed by an array. */
export class InMemoryOtpRepository {
  readonly records: OtpCode[] = [];

  async create(data: NewOtp): Promise<OtpCode> {
    const record: OtpCode = { id: `otp_${this.records.length + 1}`, attempts: 0, consumedAt: null, ...data };
    this.records.push(record);
    return record;
  }

  async findLatest(target: string): Promise<OtpCode | null> {
    const matches = this.records.filter((r) => r.target === target);
    return matches.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] ?? null;
  }

  async invalidateOpen(target: string, now: Date): Promise<void> {
    for (const r of this.records) if (r.target === target && !r.consumedAt) r.consumedAt = now;
  }

  async reserveAttempt(id: string, maxAttempts: number): Promise<boolean> {
    const record = this.records.find(
      (r) => r.id === id && !r.consumedAt && r.attempts < maxAttempts,
    );
    if (!record) return false;
    record.attempts += 1;
    return true;
  }

  async refundAttempt(id: string): Promise<void> {
    const record = this.records.find((r) => r.id === id);
    if (record && record.attempts > 0) record.attempts -= 1;
  }

  async consume(id: string, now: Date): Promise<number> {
    const record = this.records.find((r) => r.id === id && !r.consumedAt);
    if (!record) return 0;
    record.consumedAt = now;
    return 1;
  }
}
