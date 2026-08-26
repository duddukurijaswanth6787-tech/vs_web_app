import { registerAs } from '@nestjs/config';

/**
 * Maps environment variables to a nested, strongly-typed configuration object.
 */
export default registerAs('app', () => ({
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  database: {
    url: process.env.DATABASE_URL,
    slowQueryThreshold: parseInt(
      process.env.SLOW_QUERY_THRESHOLD || '1000',
      10,
    ),
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
  bullmq: {
    prefix: process.env.BULLMQ_PREFIX || 'vasanthi',
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
    // Applies to every route, and one storefront page load fans out to a
    // dozen API calls (/features, /settings/public, /categories/featured,
    // /coupons/active, /cms/banners, ...). At the old default of 10 a
    // customer browsing two pages inside a minute was rate-limited. The
    // endpoints that actually need a tight limit -- login, OTP, password
    // reset -- declare their own via common/security/throttle.decorators.ts,
    // so this one no longer has to protect them by being small.
    limit: parseInt(process.env.THROTTLE_LIMIT || '120', 10),
  },
  cors: {
    // Joi's validation schema (env.validation.ts) already guarantees this is
    // a real, non-wildcard origin allowlist in production -- the app fails
    // to boot otherwise, so no fallback is needed here.
    origin: process.env.CORS_ORIGIN || '*',
    methods:
      process.env.CORS_METHODS || 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders:
      process.env.CORS_ALLOWED_HEADERS ||
      'Content-Type,Accept,Authorization,x-correlation-id,x-request-id',
  },
  security: {
    trustProxyCount: parseInt(process.env.TRUST_PROXY_COUNT || '1', 10),
    bodyJsonLimit: process.env.BODY_JSON_LIMIT || '2mb',
    bodyUrlencodedLimit: process.env.BODY_URLENCODED_LIMIT || '2mb',
    helmetCspEnabled: process.env.HELMET_CSP_ENABLED !== 'false',
    helmetCoepEnabled: process.env.HELMET_COEP_ENABLED !== 'false',
    eventLogEnabled: process.env.SECURITY_EVENT_LOG_ENABLED !== 'false',
  },
  storage: {
    provider: process.env.STORAGE_PROVIDER || 'local',
    maxFileSize: parseInt(process.env.STORAGE_MAX_FILE_SIZE || '10485760', 10),
    allowedMimeTypes:
      process.env.STORAGE_ALLOWED_MIME_TYPES ||
      'image/jpeg,image/png,image/webp,image/avif,application/pdf,video/mp4',
    // ponytail: local-only fields, ignored when provider=s3
    root: process.env.STORAGE_ROOT || './storage',
    publicUrl: process.env.STORAGE_PUBLIC_URL || '/storage',
    s3: {
      region: process.env.AWS_REGION || 'ap-south-1',
      bucket: process.env.AWS_S3_BUCKET || '',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      endpoint: process.env.AWS_S3_ENDPOINT || undefined,
      publicUrl: process.env.AWS_S3_PUBLIC_URL || '',
      forcePathStyle: process.env.AWS_S3_FORCE_PATH_STYLE === 'true',
      signedUrlExpiry: parseInt(
        process.env.AWS_S3_SIGNED_URL_EXPIRY || '3600',
        10,
      ),
    },
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
    apiBaseUrl:
      process.env.RAZORPAY_API_BASE_URL || 'https://api.razorpay.com/v1',
    enabled: process.env.ENABLE_RAZORPAY !== 'false',
    provider: process.env.PAYMENT_PROVIDER || 'razorpay',
  },
  jwt: {
    // Joi's validation schema (env.validation.ts) already guarantees this is
    // set to a real secret in production -- the app fails to boot otherwise,
    // so no fallback is needed here.
    secret: process.env.JWT_SECRET,
    expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '900', 10),
    rememberMeExpiresIn: parseInt(
      process.env.JWT_REMEMBER_ME_EXPIRES_IN || '2592000',
      10,
    ),
    refreshTokenExpiryDays: parseInt(
      process.env.JWT_REFRESH_TOKEN_EXPIRY_DAYS || '7',
      10,
    ),
    issuer: process.env.JWT_ISSUER || 'vasanthissignature.in',
  },
  hostname: process.env.HOSTNAME || 'localhost',
  monitoring: {
    enabled: process.env.ENABLE_MONITORING !== 'false',
    slowRequestThreshold: parseInt(
      process.env.MONITORING_SLOW_REQUEST_THRESHOLD || '1000',
      10,
    ),
  },
  features: {
    // Public API docs default off in production (must opt in) and on
    // everywhere else (must opt out) -- an unset var must not expose the
    // full API surface on a public deployment.
    swagger:
      process.env.ENABLE_SWAGGER === 'true' ||
      (process.env.ENABLE_SWAGGER !== 'false' &&
        (process.env.NODE_ENV || 'development') !== 'production'),
    redis: process.env.ENABLE_REDIS !== 'false',
    bullmq: process.env.ENABLE_BULLMQ !== 'false',
    email: process.env.ENABLE_EMAIL === 'true',
    sms: process.env.ENABLE_SMS === 'true',
    storage: process.env.ENABLE_STORAGE === 'true',
    queue: process.env.ENABLE_QUEUE !== 'false',
    logger: process.env.ENABLE_LOGGER !== 'false',
  },
  sms: {
    provider: process.env.SMS_PROVIDER || 'mock',
    apiKey: process.env.SMS_API_KEY || '',
    senderId: process.env.SMS_SENDER_ID || 'VASANT',
  },
  startMessaging: {
    apiKey: process.env.STARTMESSAGING_API_KEY || '',
    baseUrl: process.env.STARTMESSAGING_BASE_URL || 'https://api.startmessaging.com',
  },
  email: {
    smtpHost: process.env.SMTP_HOST || '',
    smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
    smtpSecure: process.env.SMTP_SECURE === 'true',
    smtpUser: process.env.SMTP_USER || '',
    smtpPassword: process.env.SMTP_PASSWORD || '',
    fromAddress: process.env.EMAIL_FROM || 'no-reply@vsboutique.shop',
    fromName: process.env.EMAIL_FROM_NAME || "Vasanthi's Signature",
  },
  // Used to build links (password reset, order tracking) inside emails.
  frontendUrl: process.env.FRONTEND_URL || 'https://www.vsboutique.shop',
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    // Service-account private keys are stored with literal "\n" sequences in
    // most env var UIs (Railway, etc); FirebaseAdminService un-escapes them.
    privateKey: process.env.FIREBASE_PRIVATE_KEY || '',
  },
  google: {
    // Web OAuth client ID from Google Cloud Console -- used both to verify
    // the `aud` claim on ID tokens the frontend hands us, and (implicitly,
    // by the frontend) to initialize Google's Sign-In button.
    clientId: process.env.GOOGLE_CLIENT_ID || '',
  },
  push: {
    enabled: process.env.ENABLE_PUSH === 'true',
    serverKey: process.env.PUSH_SERVER_KEY || '',
    provider: process.env.PUSH_PROVIDER || 'fcm',
  },
  dtdc: {
    enabled: process.env.DTDC_ENABLED === 'true',
    apiKey: process.env.DTDC_API_KEY || '',
    customerCode: process.env.DTDC_CUSTOMER_CODE || '',
    apiUrl: process.env.DTDC_API_URL || 'https://dtdcapi.shipsy.io',
  },
  httpLog: {
    enabled: process.env.HTTP_LOG_ENABLED !== 'false',
    // Full bodies default off in production (must opt in) and on everywhere
    // else (must opt out), mirroring the swagger flag above. Logging every
    // request and response body verbatim is fine locally, but on a live
    // storefront -- where a single catalog or homepage response is a large
    // JSON array -- it saturated Railway's 500 logs/sec cap and started
    // dropping messages, which costs the diagnostics these logs exist for.
    // Sensitive keys are redacted either way (http-log-serializer.ts), so
    // this is about volume, not exposure.
    requestBody:
      process.env.HTTP_LOG_REQUEST_BODY === 'true' ||
      (process.env.HTTP_LOG_REQUEST_BODY !== 'false' &&
        (process.env.NODE_ENV || 'development') !== 'production'),
    responseBody:
      process.env.HTTP_LOG_RESPONSE_BODY === 'true' ||
      (process.env.HTTP_LOG_RESPONSE_BODY !== 'false' &&
        (process.env.NODE_ENV || 'development') !== 'production'),
    maxBodyLength: parseInt(
      process.env.HTTP_LOG_MAX_BODY_LENGTH || '10000',
      10,
    ),
    healthRequests: process.env.HTTP_LOG_HEALTH_REQUESTS === 'true',
    // Every request logged a request+response pair. One storefront page load
    // fans out to a dozen API calls, so a handful of concurrent visitors was
    // enough to pass Railway's 500 logs/sec cap -- at which point Railway
    // drops messages, and the ones lost in a burst are exactly the ones worth
    // reading. In production only failures and slow requests are logged;
    // set HTTP_LOG_SUCCESS=true to get the full stream back while debugging.
    successRequests:
      process.env.HTTP_LOG_SUCCESS === 'true' ||
      (process.env.HTTP_LOG_SUCCESS !== 'false' &&
        (process.env.NODE_ENV || 'development') !== 'production'),
  },
  rag: {
    enabled: process.env.RAG_ENABLED !== 'false',
    llmProvider: process.env.RAG_LLM_PROVIDER || 'gemini',
    embeddingProvider: process.env.RAG_EMBEDDING_PROVIDER || 'gemini',
    requestTimeoutMs: parseInt(
      process.env.RAG_REQUEST_TIMEOUT_MS || '30000',
      10,
    ),
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    llmModel: process.env.GEMINI_LLM_MODEL || 'gemini-1.5-flash',
    embeddingModel: process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    llmModel: process.env.OPENAI_LLM_MODEL || 'gpt-4o-mini',
    embeddingModel:
      process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
  },
}));
