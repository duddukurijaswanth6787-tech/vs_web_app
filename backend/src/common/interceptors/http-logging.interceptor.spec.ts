import { isResponseWorthLogging } from './http-logging.interceptor';

/**
 * Every request used to emit a request+response pair in production. One
 * storefront page load fans out to a dozen API calls, so a handful of
 * concurrent visitors passed Railway's 500 logs/sec cap -- and once the
 * platform starts dropping messages, the ones lost in a burst are exactly the
 * ones worth reading.
 *
 * These pin the trade: routine traffic goes quiet, anything diagnostic stays.
 */
describe('isResponseWorthLogging', () => {
  const prod = { logSuccess: false, slowMs: 1000 };

  it('drops the fast 200s that make up almost all storefront traffic', () => {
    expect(
      isResponseWorthLogging({ ...prod, statusCode: 200, durationMs: 32 }),
    ).toBe(false);
  });

  it('keeps failures -- the whole reason the logs exist', () => {
    for (const statusCode of [400, 401, 404, 422, 500, 503]) {
      expect(
        isResponseWorthLogging({ ...prod, statusCode, durationMs: 5 }),
      ).toBe(true);
    }
  });

  it('keeps slow requests even when they succeeded', () => {
    expect(
      isResponseWorthLogging({ ...prod, statusCode: 200, durationMs: 1000 }),
    ).toBe(true);
  });

  it('logs everything when success logging is switched back on', () => {
    // HTTP_LOG_SUCCESS=true is the escape hatch for debugging a live issue.
    expect(
      isResponseWorthLogging({
        logSuccess: true,
        slowMs: 1000,
        statusCode: 200,
        durationMs: 1,
      }),
    ).toBe(true);
  });
});
