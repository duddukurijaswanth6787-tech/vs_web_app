import * as Joi from 'joi';

// Map alternative AWS S3 environment variable names to the expected standard keys
if (process.env.AWS_BUCKET_NAME) {
  process.env.AWS_S3_BUCKET =
    process.env.AWS_S3_BUCKET || process.env.AWS_BUCKET_NAME;
}
if (process.env.AWS_ACCESS_KEY) {
  process.env.AWS_ACCESS_KEY_ID =
    process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY;
}
if (process.env.AWS_SECRET_KEY) {
  process.env.AWS_SECRET_ACCESS_KEY =
    process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_KEY;
}

// Map Railway Redis environment variables
if (
  (!process.env.REDIS_HOST || process.env.REDIS_HOST.trim() === '') &&
  process.env.REDISHOST
) {
  process.env.REDIS_HOST = process.env.REDISHOST;
}
if (
  (!process.env.REDIS_PORT || String(process.env.REDIS_PORT).trim() === '') &&
  process.env.REDISPORT
) {
  process.env.REDIS_PORT = process.env.REDISPORT;
}
if (
  (!process.env.REDIS_PASSWORD || process.env.REDIS_PASSWORD.trim() === '') &&
  process.env.REDISPASSWORD
) {
  process.env.REDIS_PASSWORD = process.env.REDISPASSWORD;
}
if (
  (process.env.REDIS_URL || process.env.REDISURL) &&
  (!process.env.REDIS_HOST || process.env.REDIS_HOST.trim() === '')
) {
  try {
    const redisUrl = new URL(
      process.env.REDIS_URL || process.env.REDISURL || '',
    );
    process.env.REDIS_HOST = redisUrl.hostname;
    if (redisUrl.port) process.env.REDIS_PORT = redisUrl.port;
    if (redisUrl.password)
      process.env.REDIS_PASSWORD = decodeURIComponent(redisUrl.password);
  } catch {
    // Ignore invalid REDIS_URL format
  }
}
if (process.env.REDIS_HOST === '') {
  delete process.env.REDIS_HOST;
}
if (process.env.REDIS_PORT === '' || isNaN(Number(process.env.REDIS_PORT))) {
  delete process.env.REDIS_PORT;
}

/**
 * Joi validation schema for application environment variables.
 */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(4000),
  DATABASE_URL: Joi.string()
    .required()
    .description('PostgreSQL Connection URL'),
  SLOW_QUERY_THRESHOLD: Joi.number().integer().min(0).default(1000),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').default(''),
  REDIS_DB: Joi.number().integer().min(0).default(0),
  BULLMQ_PREFIX: Joi.string().default('vasanthi'),
  THROTTLE_TTL: Joi.number().integer().min(1).default(60),
  THROTTLE_LIMIT: Joi.number().integer().min(1).default(10),
  // Wildcard/empty is fine for local dev; production must set an explicit,
  // comma-separated allowlist of real frontend origins, or the app refuses
  // to boot rather than silently running wide open (see main.ts's CORS setup).
  CORS_ORIGIN: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.string()
      .required()
      .invalid('', '*')
      .description('Comma-separated allowlist of real frontend origins, required in production'),
    otherwise: Joi.string().allow('').default('*'),
  }),

  // Security Configuration
  TRUST_PROXY_COUNT: Joi.number().integer().min(0).default(1),
  CORS_METHODS: Joi.string().default('GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS'),
  CORS_ALLOWED_HEADERS: Joi.string().default(
    'Content-Type,Accept,Authorization,x-correlation-id,x-request-id',
  ),
  BODY_JSON_LIMIT: Joi.string().default('2mb'),
  BODY_URLENCODED_LIMIT: Joi.string().default('2mb'),
  HELMET_CSP_ENABLED: Joi.boolean().default(true),
  HELMET_COEP_ENABLED: Joi.boolean().default(true),
  SECURITY_EVENT_LOG_ENABLED: Joi.boolean().default(true),

  // Storage Configuration
  STORAGE_PROVIDER: Joi.string().valid('local', 's3').default('local'),
  STORAGE_MAX_FILE_SIZE: Joi.number().integer().min(1).default(10485760),
  STORAGE_ALLOWED_MIME_TYPES: Joi.string().default(
    'image/jpeg,image/png,image/webp,image/avif,application/pdf,video/mp4',
  ),
  // ponytail: local-only, keep for dev backward compat
  STORAGE_ROOT: Joi.string().default('./storage'),
  STORAGE_PUBLIC_URL: Joi.string().default('/storage'),

  // AWS S3 Configuration (required when STORAGE_PROVIDER=s3)
  AWS_REGION: Joi.string().allow('').default('ap-south-1'),
  AWS_S3_BUCKET: Joi.string().when('STORAGE_PROVIDER', {
    is: 's3',
    then: Joi.required().description(
      'AWS_S3_BUCKET is required when STORAGE_PROVIDER=s3',
    ),
    otherwise: Joi.string().allow('').default(''),
  }),
  AWS_ACCESS_KEY_ID: Joi.string()
    .allow('')
    .default('')
    .when('STORAGE_PROVIDER', {
      is: 's3',
      then: Joi.required(),
      otherwise: Joi.string().allow('').default(''),
    }),
  AWS_SECRET_ACCESS_KEY: Joi.string()
    .allow('')
    .default('')
    .when('STORAGE_PROVIDER', {
      is: 's3',
      then: Joi.required(),
      otherwise: Joi.string().allow('').default(''),
    }),
  AWS_S3_ENDPOINT: Joi.string().uri().allow('', null).optional().default(''),
  AWS_S3_PUBLIC_URL: Joi.string().allow('', null).optional().default(''),
  AWS_S3_FORCE_PATH_STYLE: Joi.boolean().default(false),
  AWS_S3_SIGNED_URL_EXPIRY: Joi.number().integer().min(60).default(3600),

  // Razorpay Configuration
  RAZORPAY_KEY_ID: Joi.string().allow('').default(''),
  RAZORPAY_KEY_SECRET: Joi.string().allow('').default(''),
  RAZORPAY_WEBHOOK_SECRET: Joi.string().allow('').default(''),
  RAZORPAY_API_BASE_URL: Joi.string()
    .uri()
    .default('https://api.razorpay.com/v1'),
  ENABLE_RAZORPAY: Joi.boolean().default(true),
  PAYMENT_PROVIDER: Joi.string().valid('razorpay', 'dummy').default('razorpay'),

  // Monitoring Configuration
  ENABLE_MONITORING: Joi.boolean().default(true),
  MONITORING_SLOW_REQUEST_THRESHOLD: Joi.number()
    .integer()
    .min(100)
    .default(1000),

  // JWT Configuration
  // No production fallback: a hardcoded default secret sitting in this repo
  // would let anyone forge a valid admin JWT. Dev/test keep a convenience
  // default; production must set a real, unique secret or refuse to boot.
  JWT_SECRET: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.string()
      .min(32)
      .required()
      .invalid('dev-secret-change-in-production-vasanthi-key')
      .description('Real, unique JWT signing secret, required in production'),
    otherwise: Joi.string().min(16).default('dev-secret-change-in-production-vasanthi-key'),
  }),
  JWT_EXPIRES_IN: Joi.number().integer().min(60).default(900),
  JWT_REMEMBER_ME_EXPIRES_IN: Joi.number().integer().min(3600).default(2592000),
  JWT_REFRESH_TOKEN_EXPIRY_DAYS: Joi.number()
    .integer()
    .min(1)
    .max(90)
    .default(7),
  JWT_ISSUER: Joi.string().default('vasanthi-designers'),

  // Feature Flags
  // ponytail: feature flags validate as boolean strings or boolean values dynamically
  ENABLE_SWAGGER: Joi.boolean().default(true),
  ENABLE_REDIS: Joi.boolean().default(true),
  ENABLE_BULLMQ: Joi.boolean().default(true),
  ENABLE_EMAIL: Joi.boolean().default(false),
  ENABLE_SMS: Joi.boolean().default(false),
  ENABLE_STORAGE: Joi.boolean().default(false),
  ENABLE_QUEUE: Joi.boolean().default(true),
  ENABLE_LOGGER: Joi.boolean().default(true),

  // HTTP Logger Configuration
  HTTP_LOG_ENABLED: Joi.boolean().default(true),
  HTTP_LOG_REQUEST_BODY: Joi.boolean().default(true),
  HTTP_LOG_RESPONSE_BODY: Joi.boolean().default(true),
  HTTP_LOG_MAX_BODY_LENGTH: Joi.number().integer().min(0).default(10000),
  HTTP_LOG_HEALTH_REQUESTS: Joi.boolean().default(false),

  // RAG Configuration
  RAG_ENABLED: Joi.boolean().default(true),
  RAG_DEFAULT_AGENT_KEY: Joi.string().default('customer_support_agent'),
  RAG_CHUNK_SIZE: Joi.number().integer().default(800),
  RAG_CHUNK_OVERLAP: Joi.number().integer().default(120),
  RAG_TOP_K: Joi.number().integer().default(8),
  RAG_MIN_RELEVANCE_SCORE: Joi.number().default(0.65),
  RAG_MAX_CONTEXT_CHUNKS: Joi.number().integer().default(6),
  RAG_CONVERSATION_HISTORY_LIMIT: Joi.number().integer().default(12),
  RAG_TOOL_MAX_EXECUTIONS: Joi.number().integer().default(5),
  RAG_REQUEST_TIMEOUT_MS: Joi.number().integer().default(30000),
  RAG_MAX_MESSAGE_LENGTH: Joi.number().integer().default(4000),
  RAG_URL_FETCH_TIMEOUT_MS: Joi.number().integer().default(10000),
  RAG_URL_MAX_REDIRECTS: Joi.number().integer().default(3),
  RAG_URL_MAX_CONTENT_BYTES: Joi.number().integer().default(5242880),

  RAG_LLM_PROVIDER: Joi.string().valid('gemini', 'openai').default('gemini'),
  RAG_EMBEDDING_PROVIDER: Joi.string()
    .valid('gemini', 'openai')
    .default('gemini'),
  GEMINI_LLM_MODEL: Joi.string().default('gemini-1.5-flash'),
  GEMINI_EMBEDDING_MODEL: Joi.string().default('text-embedding-004'),
  OPENAI_LLM_MODEL: Joi.string().default('gpt-4o-mini'),
  OPENAI_EMBEDDING_MODEL: Joi.string().default('text-embedding-3-small'),

  GEMINI_API_KEY: Joi.string()
    .allow('')
    .default('')
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.string().when('RAG_ENABLED', {
        is: true,
        then: Joi.string().when('RAG_LLM_PROVIDER', {
          is: 'gemini',
          then: Joi.required(),
          otherwise: Joi.string().when('RAG_EMBEDDING_PROVIDER', {
            is: 'gemini',
            then: Joi.required(),
            otherwise: Joi.optional(),
          }),
        }),
        otherwise: Joi.optional(),
      }),
      otherwise: Joi.optional(),
    }),

  OPENAI_API_KEY: Joi.string()
    .allow('')
    .default('')
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.string().when('RAG_ENABLED', {
        is: true,
        then: Joi.string().when('RAG_LLM_PROVIDER', {
          is: 'openai',
          then: Joi.required(),
          otherwise: Joi.string().when('RAG_EMBEDDING_PROVIDER', {
            is: 'openai',
            then: Joi.required(),
            otherwise: Joi.optional(),
          }),
        }),
        otherwise: Joi.optional(),
      }),
      otherwise: Joi.optional(),
    }),
});
