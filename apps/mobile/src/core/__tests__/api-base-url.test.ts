import { resolveApiBaseUrl } from '../config/api-base-url';

describe('resolveApiBaseUrl', () => {
  it('uses the emulator host alias in development', () => {
    expect(resolveApiBaseUrl({ isDev: true, releaseUrl: '' })).toBe('http://10.0.2.2:3000/api/v1');
  });

  it('requires a configured URL in release builds', () => {
    expect(resolveApiBaseUrl({ isDev: false, releaseUrl: 'https://api.lamma.app/api/v1' })).toBe(
      'https://api.lamma.app/api/v1',
    );
    expect(() => resolveApiBaseUrl({ isDev: false, releaseUrl: '' })).toThrow(/releaseApiBaseUrl/);
  });
});
