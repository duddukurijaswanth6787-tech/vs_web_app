import { envValidationSchema } from './env.validation';

/**
 * Regression check for the production fail-loud rules on JWT_SECRET and
 * CORS_ORIGIN -- both used to silently fall back to a hardcoded/wildcard
 * value in production instead of refusing to boot. This only re-verifies
 * those two rules, not the full schema.
 */
describe('envValidationSchema (JWT_SECRET / CORS_ORIGIN production rules)', () => {
  const baseEnv = {
    NODE_ENV: 'production',
    DATABASE_URL: 'postgres://user:pass@host:5432/db',
    JWT_SECRET: 'a-real-unique-production-secret-value',
    CORS_ORIGIN: 'https://vsboutique.shop',
    // Sidestep RAG's own production-required keys (GEMINI_API_KEY etc.) --
    // unrelated to the JWT_SECRET/CORS_ORIGIN rules under test here.
    RAG_ENABLED: false,
  };

  const validate = (overrides: Record<string, unknown>) =>
    envValidationSchema.validate(
      { ...baseEnv, ...overrides },
      { allowUnknown: true, abortEarly: false },
    );

  it('passes with a real JWT_SECRET and CORS_ORIGIN in production', () => {
    const { error } = validate({});
    expect(error).toBeUndefined();
  });

  it('rejects a missing JWT_SECRET in production', () => {
    const { JWT_SECRET, ...rest } = baseEnv;
    const { error } = envValidationSchema.validate(rest, {
      allowUnknown: true,
      abortEarly: false,
    });
    expect(error?.message).toContain('JWT_SECRET');
  });

  it('rejects the known dev-default JWT_SECRET in production', () => {
    const { error } = validate({
      JWT_SECRET: 'dev-secret-change-in-production-vasanthi-key',
    });
    expect(error?.message).toContain('JWT_SECRET');
  });

  it('rejects a missing CORS_ORIGIN in production', () => {
    const { CORS_ORIGIN, ...rest } = baseEnv;
    const { error } = envValidationSchema.validate(rest, {
      allowUnknown: true,
      abortEarly: false,
    });
    expect(error?.message).toContain('CORS_ORIGIN');
  });

  it('rejects a wildcard CORS_ORIGIN in production', () => {
    const { error } = validate({ CORS_ORIGIN: '*' });
    expect(error?.message).toContain('CORS_ORIGIN');
  });

  it('allows the dev-default JWT_SECRET and wildcard CORS_ORIGIN outside production', () => {
    const { error } = envValidationSchema.validate(
      {
        NODE_ENV: 'development',
        DATABASE_URL: baseEnv.DATABASE_URL,
      },
      { allowUnknown: true, abortEarly: false },
    );
    expect(error).toBeUndefined();
  });
});
