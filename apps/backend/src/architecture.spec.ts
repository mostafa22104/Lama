import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const modulesDir = resolve(dirname(fileURLToPath(import.meta.url)), 'modules');
const RELATIVE_IMPORT = /from\s+'(\.[^']+)'/g;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return path.endsWith('.ts') ? [path] : [];
  });
}

function featureOf(path: string): string | null {
  const rel = relative(modulesDir, path);
  return rel.startsWith('..') ? null : rel.split(sep)[0];
}

describe('feature boundaries', () => {
  it('features import other features only through their index.ts', () => {
    const violations: string[] = [];
    for (const file of sourceFiles(modulesDir)) {
      const own = featureOf(file);
      for (const [, spec] of readFileSync(file, 'utf8').matchAll(RELATIVE_IMPORT)) {
        const target = resolve(dirname(file), spec);
        const other = featureOf(target);
        if (!other || other === own) continue;
        if (relative(join(modulesDir, other), target) !== 'index.js') {
          violations.push(`${relative(modulesDir, file)} → ${spec}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
