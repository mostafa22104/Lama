import MockAdapter from 'axios-mock-adapter';
import { AppError } from '../api/app-error';
import { configureAuth, createApiClient } from '../api/client';

const tokenInvalid = [401, { code: 'TOKEN_INVALID', message: 'expired' }] as const;

describe('api client', () => {
  let access: string | null;
  let refresh: jest.Mock<Promise<string | null>, []>;
  let onAuthFailure: jest.Mock;

  beforeEach(() => {
    access = 'old';
    refresh = jest.fn(async () => {
      access = 'new';
      return 'new';
    });
    onAuthFailure = jest.fn();
    configureAuth({ getAccessToken: () => access, refresh, onAuthFailure });
  });

  afterEach(() => configureAuth(null));

  it('sends the access token', async () => {
    const client = createApiClient('http://api');
    const mock = new MockAdapter(client);
    mock.onGet('/business').reply((config) => [200, { auth: config.headers?.Authorization }]);
    await expect(client.get('/business')).resolves.toMatchObject({ data: { auth: 'Bearer old' } });
  });

  it('refreshes once for parallel 401s and retries each request once', async () => {
    const client = createApiClient('http://api');
    const mock = new MockAdapter(client);
    mock.onGet(/\/a|\/b/).reply((config) =>
      config.headers?.Authorization === 'Bearer new' ? [200, { ok: config.url }] : [...tokenInvalid],
    );
    const [a, b] = await Promise.all([client.get('/a'), client.get('/b')]);
    expect([a.data, b.data]).toEqual([{ ok: '/a' }, { ok: '/b' }]);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('signs out when the refresh fails', async () => {
    refresh.mockResolvedValueOnce(null);
    const client = createApiClient('http://api');
    new MockAdapter(client).onGet('/a').reply(...tokenInvalid);
    await expect(client.get('/a')).rejects.toMatchObject({ code: 'TOKEN_INVALID' });
    expect(onAuthFailure).toHaveBeenCalledTimes(1);
  });

  it('does not refresh for other errors', async () => {
    const client = createApiClient('http://api');
    new MockAdapter(client).onPost('/x').reply(400, { code: 'VALIDATION_FAILED', message: '' });
    await expect(client.post('/x')).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    expect(refresh).not.toHaveBeenCalled();
  });

  it('keeps the session when refresh hits a network error', async () => {
    refresh.mockRejectedValueOnce(new AppError('NETWORK'));
    const client = createApiClient('http://api');
    new MockAdapter(client).onGet('/a').reply(...tokenInvalid);
    await expect(client.get('/a')).rejects.toMatchObject({ code: 'NETWORK' });
    expect(onAuthFailure).not.toHaveBeenCalled();
  });

  it('signs out once when parallel requests share a failed refresh', async () => {
    refresh.mockResolvedValueOnce(null);
    const client = createApiClient('http://api');
    new MockAdapter(client).onGet(/\/a|\/b/).reply(...tokenInvalid);
    const results = await Promise.allSettled([client.get('/a'), client.get('/b')]);
    expect(results.map((r) => r.status === 'rejected' && (r.reason as AppError).code)).toEqual([
      'TOKEN_INVALID',
      'TOKEN_INVALID',
    ]);
    expect(onAuthFailure).toHaveBeenCalledTimes(1);
  });

  it('signs out when the refresh is rejected by the server', async () => {
    refresh.mockRejectedValueOnce(new AppError('TOKEN_INVALID', 401));
    const client = createApiClient('http://api');
    new MockAdapter(client).onGet('/a').reply(...tokenInvalid);
    await expect(client.get('/a')).rejects.toMatchObject({ code: 'TOKEN_INVALID' });
    expect(onAuthFailure).toHaveBeenCalledTimes(1);
  });

  it('keeps the session when the server fails during refresh', async () => {
    refresh.mockRejectedValueOnce(new AppError('INTERNAL_ERROR', 500));
    const client = createApiClient('http://api');
    new MockAdapter(client).onGet('/a').reply(...tokenInvalid);
    await expect(client.get('/a')).rejects.toMatchObject({ code: 'INTERNAL_ERROR' });
    expect(onAuthFailure).not.toHaveBeenCalled();
  });
});
