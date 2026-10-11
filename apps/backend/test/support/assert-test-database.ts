import { readFileSync } from 'node:fs';
import { parse } from 'dotenv';

function describeTarget(url: string | undefined): string {
  if (!url) return '(unset)';
  try {
    const u = new URL(url);
    return `${u.hostname}:${u.port}${u.pathname}`;
  } catch {
    return '(unparseable)';
  }
}

export function assertTestDatabase(url: string | undefined): void {
  const expected = parse(readFileSync('.env.test', 'utf8'))['DATABASE_URL'];
  if (process.env['NODE_ENV'] !== 'test' || !url || url !== expected) {
    throw new Error(
      `Refusing to touch a non-test database: ${describeTarget(url)} (NODE_ENV=${process.env['NODE_ENV']})`,
    );
  }
}
