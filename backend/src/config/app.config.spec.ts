/**
 * Full HTTP body logging is fine locally but saturated Railway's 500 logs/sec
 * cap on the live storefront, dropping messages. These pin the opt-in/opt-out
 * split: off by default in production, on by default everywhere else, with an
 * explicit value always winning.
 */
describe('app.config httpLog body flags', () => {
  const loadConfig = (env: Record<string, string | undefined>) => {
    jest.resetModules();
    const saved = { ...process.env };
    Object.assign(process.env, env);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require('./app.config').default();
    process.env = saved;
    return config.httpLog as { requestBody: boolean; responseBody: boolean };
  };

  it('logs bodies by default outside production', () => {
    const httpLog = loadConfig({
      NODE_ENV: 'development',
      HTTP_LOG_REQUEST_BODY: undefined,
      HTTP_LOG_RESPONSE_BODY: undefined,
    });

    expect(httpLog.requestBody).toBe(true);
    expect(httpLog.responseBody).toBe(true);
  });

  it('does not log bodies by default in production', () => {
    const httpLog = loadConfig({
      NODE_ENV: 'production',
      HTTP_LOG_REQUEST_BODY: undefined,
      HTTP_LOG_RESPONSE_BODY: undefined,
    });

    expect(httpLog.requestBody).toBe(false);
    expect(httpLog.responseBody).toBe(false);
  });

  it('still allows opting in explicitly in production, for debugging', () => {
    const httpLog = loadConfig({
      NODE_ENV: 'production',
      HTTP_LOG_REQUEST_BODY: 'true',
      HTTP_LOG_RESPONSE_BODY: 'true',
    });

    expect(httpLog.requestBody).toBe(true);
    expect(httpLog.responseBody).toBe(true);
  });

  it('still allows opting out explicitly outside production', () => {
    const httpLog = loadConfig({
      NODE_ENV: 'development',
      HTTP_LOG_REQUEST_BODY: 'false',
      HTTP_LOG_RESPONSE_BODY: 'false',
    });

    expect(httpLog.requestBody).toBe(false);
    expect(httpLog.responseBody).toBe(false);
  });
});
