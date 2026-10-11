import { type ContactChannel, normalizeContact } from '@lamma/shared';
import { AppError } from '../../common/errors/app-error.js';

export function normalizeTarget(channel: ContactChannel, raw: string): string {
  const target = normalizeContact(channel, raw);
  if (!target) throw new AppError('CONTACT_INVALID', `Invalid ${channel}`);
  return target;
}
