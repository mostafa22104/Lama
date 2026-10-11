import { execSync } from 'node:child_process';
import { config } from 'dotenv';
import { assertTestDatabase } from './support/assert-test-database.js';

export default function setup(): void {
  config({ path: '.env.test', override: true, quiet: true });
  assertTestDatabase(process.env['DATABASE_URL']);
  execSync('yarn prisma migrate deploy', { stdio: 'inherit', env: process.env });
}
