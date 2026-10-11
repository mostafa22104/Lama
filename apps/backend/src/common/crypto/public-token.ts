import { randomBytes } from 'node:crypto';

/** Unguessable token for the customer's public pay link (/p/:token). */
export function generatePublicToken(): string {
  return randomBytes(16).toString('base64url');
}
