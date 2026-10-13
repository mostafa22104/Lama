import { waitFor } from '@testing-library/react-native';
import MockAdapter from 'axios-mock-adapter';
import { api, publicApi } from '../../../core/api/instances';
import { readRefreshToken, saveRefreshToken, clearRefreshToken } from '../../../core/storage/secure-token';
import { useAuthStore } from '../auth-store';
import { installAuthHooks, restoreSession, signIn, signOut } from '../session';

const business = { id: 'b1', name: 'أكاديمية النجوم للكرة', type: 'academy', instapayAddress: 'x@instapay', phone: '+201012345678', email: null, plan: 'free', logoUrl: null, area: null, weeklyBackup: false };
const tokens = { accessToken: 'acc-2', refreshToken: 'ref-2', accessTokenExpiresIn: 900 };

describe('session', () => {
  let apiMock: MockAdapter;
  let publicMock: MockAdapter;

  beforeEach(async () => {
    apiMock = new MockAdapter(api);
    publicMock = new MockAdapter(publicApi);
    useAuthStore.setState({ status: 'restoring', accessToken: null, business: null });
    await clearRefreshToken();
    installAuthHooks();
  });

  afterEach(() => {
    apiMock.restore();
    publicMock.restore();
  });

  it('goes to signed-out when there is no saved session', async () => {
    await restoreSession();
    expect(useAuthStore.getState().status).toBe('signedOut');
  });

  it('restores a saved session and rotates the refresh token', async () => {
    await saveRefreshToken('ref-1');
    publicMock.onPost('/auth/refresh', { refreshToken: 'ref-1' }).reply(200, tokens);
    apiMock.onGet('/business').reply(200, business);
    await restoreSession();
    expect(useAuthStore.getState()).toMatchObject({ status: 'signedIn', accessToken: 'acc-2', business: { id: 'b1' } });
    await expect(readRefreshToken()).resolves.toBe('ref-2');
  });

  it('signs out and forgets the token when the server rejects it', async () => {
    await saveRefreshToken('ref-1');
    publicMock.onPost('/auth/refresh').reply(401, { code: 'TOKEN_INVALID', message: '' });
    await restoreSession();
    expect(useAuthStore.getState().status).toBe('signedOut');
    await expect(readRefreshToken()).resolves.toBeNull();
  });

  it('keeps the session when the network is down', async () => {
    await saveRefreshToken('ref-1');
    publicMock.onPost('/auth/refresh').networkError();
    await restoreSession();
    expect(useAuthStore.getState().status).toBe('offline');
    await expect(readRefreshToken()).resolves.toBe('ref-1');
  });

  it('signs in from a verify response and signs out cleanly', async () => {
    await signIn({ business: business as never, tokens, isNewBusiness: true });
    expect(useAuthStore.getState()).toMatchObject({ status: 'signedIn', accessToken: 'acc-2' });
    await expect(readRefreshToken()).resolves.toBe('ref-2');

    publicMock.onPost('/auth/logout').reply(204);
    await signOut();
    expect(useAuthStore.getState()).toMatchObject({ status: 'signedOut', accessToken: null, business: null });
    await expect(readRefreshToken()).resolves.toBeNull();
  });

  it('refreshes an expired access token transparently during use', async () => {
    await signIn({ business: business as never, tokens: { ...tokens, accessToken: 'stale' }, isNewBusiness: false });
    publicMock.onPost('/auth/refresh').reply(200, { ...tokens, accessToken: 'fresh', refreshToken: 'ref-3' });
    apiMock.onGet('/business').reply((config) =>
      config.headers?.Authorization === 'Bearer fresh' ? [200, business] : [401, { code: 'TOKEN_INVALID', message: '' }],
    );
    await expect(api.get('/business')).resolves.toMatchObject({ data: { id: 'b1' } });
    expect(useAuthStore.getState().accessToken).toBe('fresh');
    await expect(readRefreshToken()).resolves.toBe('ref-3');
  });

  it('signs out when the in-use refresh is rejected as invalid', async () => {
    await signIn({ business: business as never, tokens: { ...tokens, accessToken: 'stale' }, isNewBusiness: false });
    publicMock.onPost('/auth/refresh').reply(401, { code: 'TOKEN_INVALID', message: '' });
    apiMock.onGet('/business').reply(401, { code: 'TOKEN_INVALID', message: '' });
    await expect(api.get('/business')).rejects.toMatchObject({ code: 'TOKEN_INVALID' });
    await waitFor(() => expect(useAuthStore.getState().status).toBe('signedOut'));
    await expect(readRefreshToken()).resolves.toBeNull();
  });

  it('keeps the session when the in-use refresh hits a server error', async () => {
    await signIn({ business: business as never, tokens: { ...tokens, accessToken: 'stale' }, isNewBusiness: false });
    publicMock.onPost('/auth/refresh').reply(500, { code: 'INTERNAL_ERROR', message: '' });
    apiMock.onGet('/business').reply(401, { code: 'TOKEN_INVALID', message: '' });
    await expect(api.get('/business')).rejects.toBeDefined();
    expect(useAuthStore.getState().status).toBe('signedIn');
    await expect(readRefreshToken()).resolves.toBe('ref-2');
  });

  it('goes offline but keeps the rotated token when loading the business fails after a refresh', async () => {
    await saveRefreshToken('ref-1');
    publicMock.onPost('/auth/refresh').reply(200, tokens);
    apiMock.onGet('/business').reply(500, { code: 'INTERNAL_ERROR', message: '' });
    await restoreSession();
    expect(useAuthStore.getState().status).toBe('offline');
    await expect(readRefreshToken()).resolves.toBe('ref-2');
  });

  it('goes offline and keeps the token when the refresh endpoint returns a server error', async () => {
    await saveRefreshToken('ref-1');
    publicMock.onPost('/auth/refresh').reply(500, { code: 'INTERNAL_ERROR', message: '' });
    await restoreSession();
    expect(useAuthStore.getState().status).toBe('offline');
    await expect(readRefreshToken()).resolves.toBe('ref-1');
  });
});
