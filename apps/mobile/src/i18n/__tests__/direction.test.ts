import { changeLanguage, type DirectionDeps, ensureDirection } from '../direction';
import { useLanguageStore } from '../language-store';

function fakeDeps(isRTL: boolean): DirectionDeps & { calls: string[] } {
  const calls: string[] = [];
  return {
    isRTL,
    calls,
    allowRTL: (v) => calls.push(`allow:${v}`),
    forceRTL: (v) => calls.push(`force:${v}`),
    restart: () => calls.push('restart'),
  };
}

describe('direction', () => {
  it('does nothing when the layout already matches the language', () => {
    const deps = fakeDeps(true);
    expect(ensureDirection('ar', deps)).toBe(false);
    expect(deps.calls).toEqual([]);
  });

  it('fixes a mismatch at startup and restarts once', () => {
    const deps = fakeDeps(true);
    expect(ensureDirection('en', deps)).toBe(true);
    expect(deps.calls).toEqual(['allow:true', 'force:false', 'restart']);
  });

  it('saves the language, applies its direction and restarts', () => {
    const deps = fakeDeps(true);
    changeLanguage('en', deps);
    expect(useLanguageStore.getState().language).toBe('en');
    expect(deps.calls).toEqual(['allow:true', 'force:false', 'restart']);
  });

  it('does not restart if changing to the current language', () => {
    useLanguageStore.setState({ language: 'ar' });
    const deps = fakeDeps(true);
    changeLanguage('ar', deps);
    expect(deps.calls).toEqual([]);
  });

  it('defaults to Arabic', () => {
    useLanguageStore.setState({ language: 'ar' });
    expect(useLanguageStore.persist.getOptions().name).toBe('language');
  });
});
