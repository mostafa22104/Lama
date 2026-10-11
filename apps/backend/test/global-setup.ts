import { execSync } from 'node:child_process';
import { config } from 'dotenv';

export default function setup(): void {
  config({ path: '.env.test', override: true, quiet: true });
  execSync('yarn prisma migrate deploy', { stdio: 'inherit', env: process.env });
}
