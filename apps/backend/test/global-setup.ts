import { execSync } from 'node:child_process';
import { assertTestDatabase } from './support/assert-test-database.js';
import { applyTestEnv } from './support/load-test-env.js';

export default function setup(): void {
  applyTestEnv();
  assertTestDatabase(process.env['DATABASE_URL']);
  execSync('yarn prisma migrate deploy', { stdio: 'inherit', env: process.env });
}
