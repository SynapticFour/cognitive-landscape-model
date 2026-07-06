import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(process.cwd());
const PACKAGES_DIR = path.join(ROOT, 'packages');

const MEASUREMENT_PACKAGES = ['core', 'landscape', 'dynamics', 'structural'] as const;

function collectSourceFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      if (entry === 'node_modules' || entry === 'dist') continue;
      files.push(...collectSourceFiles(fullPath));
      continue;
    }
    if (entry.endsWith('.ts') && !entry.endsWith('.test.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

describe('CLM layer boundaries', () => {
  it('measurement packages do not import bridge or interpretation layers', () => {
    const violations: string[] = [];

    for (const pkg of MEASUREMENT_PACKAGES) {
      const srcDir = path.join(PACKAGES_DIR, pkg, 'src');
      for (const file of collectSourceFiles(srcDir)) {
        const content = readFileSync(file, 'utf8');
        if (content.includes('@clm/interpretation') || content.includes('@clm/trajectory-explanation')) {
          violations.push(path.relative(ROOT, file));
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('landscape package does not reference interpretation vocabulary', () => {
    const srcDir = path.join(PACKAGES_DIR, 'landscape', 'src');
    const banned = ['WorldviewMapping', 'InterpretationReading', 'diagnosis', 'archetype'];

    for (const file of collectSourceFiles(srcDir)) {
      const content = readFileSync(file, 'utf8');
      for (const term of banned) {
        expect(content.includes(term), `${path.basename(file)} must not contain "${term}"`).toBe(false);
      }
    }
  });

  it('dynamics package does not reference psychological diagnostic labels', () => {
    const srcDir = path.join(PACKAGES_DIR, 'dynamics', 'src');
    const banned = ['autism', 'ADHD', 'adhd', 'Autism'];

    for (const file of collectSourceFiles(srcDir)) {
      const content = readFileSync(file, 'utf8');
      for (const term of banned) {
        expect(content.includes(term), `${path.basename(file)} must not contain "${term}"`).toBe(false);
      }
    }
  });

  it('structural package does not reference psychological diagnostic labels', () => {
    const srcDir = path.join(PACKAGES_DIR, 'structural', 'src');
    const banned = ['autism', 'ADHD', 'adhd', 'Autism', 'diagnosis'];

    for (const file of collectSourceFiles(srcDir)) {
      const content = readFileSync(file, 'utf8');
      for (const term of banned) {
        expect(content.includes(term), `${path.basename(file)} must not contain "${term}"`).toBe(false);
      }
    }
  });

  it('interpretation package does not mutate measurement packages at import time', () => {
    const srcDir = path.join(PACKAGES_DIR, 'interpretation', 'src');
    const bannedMutations = ['state.createState(', '.profile =', 'coordinates() ='];

    for (const file of collectSourceFiles(srcDir)) {
      const content = readFileSync(file, 'utf8');
      for (const term of bannedMutations) {
        expect(content.includes(term), `${path.basename(file)} must not write to state (${term})`).toBe(false);
      }
    }
  });
});
