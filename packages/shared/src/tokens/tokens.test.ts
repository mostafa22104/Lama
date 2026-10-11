import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast.js';
import { darkTheme, lightTheme, themes } from './index.js';
import { statusKeyFor } from './status.js';
import type { Theme } from './theme.js';

const AA = 4.5;

function readablePairs(theme: Theme): Array<[string, string, string]> {
  const c = theme.colors;
  return [
    ['ink on bg', c.ink, c.bg],
    ['ink on surface', c.ink, c.surface],
    ['muted on bg', c.muted, c.bg],
    ['muted on surface', c.muted, c.surface],
    ['onPrimary on primary', c.onPrimary, c.primary],
    ['onPrimary on whatsapp', c.onPrimary, c.whatsapp],
    ['primaryInk on surface', c.primaryInk, c.surface],
    ['danger on surface', c.danger, c.surface],
    ...Object.entries(theme.status).map(
      ([key, s]) => [`status ${key}`, s.fg, s.bg] as [string, string, string],
    ),
  ];
}

describe('contrastRatio', () => {
  it('is 21 for black on white and 1 for identical colors', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
    expect(contrastRatio('#0F5E56', '#0F5E56')).toBeCloseTo(1, 5);
  });
});

describe('themes', () => {
  it('light theme uses the handoff palette', () => {
    expect(lightTheme.colors.bg).toBe('#F6F4EF');
    expect(lightTheme.colors.primary).toBe('#0F5E56');
    expect(lightTheme.status.overdue).toEqual({ fg: '#A8231B', bg: '#FBE4E1' });
  });

  it('dark and light expose exactly the same keys', () => {
    expect(Object.keys(darkTheme.colors).sort()).toEqual(Object.keys(lightTheme.colors).sort());
    expect(Object.keys(darkTheme.status).sort()).toEqual(Object.keys(lightTheme.status).sort());
  });

  it.each(Object.values(themes))('$name theme text pairs meet WCAG AA', (theme) => {
    for (const [label, fg, bg] of readablePairs(theme)) {
      expect(contrastRatio(fg, bg), `${theme.name}: ${label}`).toBeGreaterThanOrEqual(AA);
    }
  });
});

describe('statusKeyFor', () => {
  it('maps invoice statuses to chip colors, with no chip for upcoming', () => {
    expect(statusKeyFor('paid')).toBe('paid');
    expect(statusKeyFor('due_soon')).toBe('dueSoon');
    expect(statusKeyFor('overdue')).toBe('overdue');
    expect(statusKeyFor('awaiting_confirmation')).toBe('awaiting');
    expect(statusKeyFor('upcoming')).toBeNull();
  });
});
