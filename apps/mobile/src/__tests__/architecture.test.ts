/// <reference types="node" />
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';

const featuresDir = resolve(__dirname, '../features');
const IMPORT = /from\s+['"](\.[^'"]+)['"]/g;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(path) ? [path] : [];
  });
}

function featureOf(path: string): string | null {
  const rel = relative(featuresDir, path);
  return rel.startsWith('..') ? null : rel.split(sep)[0];
}

test('features import other features only through their index', () => {
  const files = sourceFiles(featuresDir);
  expect(files.length).toBeGreaterThan(0);
  const violations: string[] = [];
  for (const file of files) {
    const own = featureOf(file);
    for (const [, spec] of readFileSync(file, 'utf8').matchAll(IMPORT)) {
      const target = resolve(dirname(file), spec);
      const other = featureOf(target);
      if (!other || other === own) continue;
      const relToFeature = relative(join(featuresDir, other), target);
      if (relToFeature !== '' && relToFeature !== 'index') {
        violations.push(`${relative(featuresDir, file)} → ${spec}`);
      }
    }
  }
  expect(violations).toEqual([]);
});
