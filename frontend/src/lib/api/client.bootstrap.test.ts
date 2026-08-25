/**
 * The access token is memory-only, so a cold page load starts with none. These
 * cover the bootstrap that resolves it from the httpOnly refresh cookie before
 * the first token-less request, rather than letting every query 401 first.
 */
import type { AxiosStatic } from 'axios';

jest.mock('axios');

type MockedAxios = jest.Mocked<AxiosStatic>;

describe('access token bootstrap', () => {
  let requestHandlers: Array<(config: unknown) => unknown>;

  /**
   * client.ts keeps bootstrap state in module scope, so each case needs a fresh
   * module. resetModules() also rebuilds the axios mock, so the instance must be
   * re-fetched and re-stubbed here rather than captured once at file scope.
   */
  const loadModule = async () => {
    jest.resetModules();
    requestHandlers = [];

    const axiosMod = (await import('axios')).default as unknown as MockedAxios;
    (axiosMod.create as jest.Mock).mockReturnValue({
      interceptors: {
        request: { use: (fn: (c: unknown) => unknown) => requestHandlers.push(fn) },
        response: { use: () => undefined },
      },
    });

    const client = await import('./client');
    return { client, axiosMod };
  };

  const runRequest = (url: string) =>
    requestHandlers[0]({ url, headers: {} }) as Promise<{ headers: Record<string, string> }>;

  const resolvesToken = (axiosMod: MockedAxios, accessToken = 'fresh-token') =>
    (axiosMod.post as jest.Mock).mockResolvedValue({ data: { data: { accessToken } } });

  it('resolves the token once and attaches it, instead of letting the request 401', async () => {
    const { axiosMod } = await loadModule();
    resolvesToken(axiosMod);

    const config = await runRequest('/me/orders');

    expect(axiosMod.post).toHaveBeenCalledTimes(1);
    expect((axiosMod.post as jest.Mock).mock.calls[0][0]).toContain('/auth/refresh');
    expect(config.headers.Authorization).toBe('Bearer fresh-token');
  });

  it('bootstraps once for concurrent cold-load requests, not once each', async () => {
    // The regression this guards: the profile page fires ~5 queries in
    // parallel on mount. Without single-flight that is 5 refresh calls.
    const { axiosMod } = await loadModule();
    resolvesToken(axiosMod);

    await Promise.all([
      runRequest('/me'),
      runRequest('/me/orders'),
      runRequest('/me/addresses'),
      runRequest('/me/pending-reviews'),
    ]);

    expect(axiosMod.post).toHaveBeenCalledTimes(1);
  });

  it('never bootstraps from an auth entry point, which would recurse', async () => {
    const { axiosMod } = await loadModule();
    resolvesToken(axiosMod);

    await runRequest('/auth/refresh');
    await runRequest('/auth/login');
    await runRequest('/auth/google');

    expect(axiosMod.post).not.toHaveBeenCalled();
  });

  it('gives up after one failed attempt so a signed-out visitor does not retry per request', async () => {
    const { axiosMod } = await loadModule();
    (axiosMod.post as jest.Mock).mockRejectedValue(new Error('no session'));

    const first = await runRequest('/me');
    const second = await runRequest('/me/orders');

    expect(axiosMod.post).toHaveBeenCalledTimes(1);
    expect(first.headers.Authorization).toBeUndefined();
    expect(second.headers.Authorization).toBeUndefined();
  });

  describe('resolveSession', () => {
    it('reports a session when the refresh cookie yields a token', async () => {
      const { client, axiosMod } = await loadModule();
      resolvesToken(axiosMod);

      await expect(client.resolveSession()).resolves.toBe(true);
    });

    it('reports no session for a signed-out visitor, so /auth/me is never sent', async () => {
      // The whole point: an unsent request cannot 401, and a 401 is logged by
      // the browser itself where no try/catch can reach it.
      const { client, axiosMod } = await loadModule();
      (axiosMod.post as jest.Mock).mockRejectedValue(new Error('no session'));

      await expect(client.resolveSession()).resolves.toBe(false);
    });

    it('answers from memory once a token is known, without re-asking', async () => {
      const { client, axiosMod } = await loadModule();
      resolvesToken(axiosMod, 'unused');
      client.setClientTokens({ accessToken: 't', refreshToken: '', expiresIn: 1 } as never);

      await expect(client.resolveSession()).resolves.toBe(true);
      expect(axiosMod.post).not.toHaveBeenCalled();
    });
  });

  it('skips the bootstrap entirely once a login has supplied a token', async () => {
    const { client, axiosMod } = await loadModule();
    resolvesToken(axiosMod, 'unused');

    client.setClientTokens({
      accessToken: 'login-token',
      refreshToken: '',
      expiresIn: 3600,
    } as never);
    const config = await runRequest('/me');

    expect(axiosMod.post).not.toHaveBeenCalled();
    expect(config.headers.Authorization).toBe('Bearer login-token');
  });
});
