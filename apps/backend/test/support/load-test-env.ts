import { existsSync, readFileSync } from 'node:fs';
import { parse } from 'dotenv';

/** Committed Docker defaults from `.env.test`, overridden by the git-ignored `.env.test.local`. */
export function loadTestEnv(): Record<string, string> {
  const merged = parse(readFileSync('.env.test', 'utf8'));
  if (existsSync('.env.test.local')) Object.assign(merged, parse(readFileSync('.env.test.local', 'utf8')));
  return merged;
}

export function applyTestEnv(): void {
  Object.assign(process.env, loadTestEnv());
}
