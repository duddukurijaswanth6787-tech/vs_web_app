console.log('[STARTUP] Executing main.ts module script...');

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { LoggerService } from '@common/logger/logger.service';
import { AppModule } from '@core/app.module';
import { StartupDashboardService } from '@common/startup/startup.service';
import { setupSwagger } from '@core/swagger/swagger.config';
import { ValidationException } from '@common/exceptions';
import { SECURITY_CONSTANTS } from '@common/security';

async function bootstrap() {
  console.log('[BOOTSTRAP] Starting NestJS Application...');
  const startTime = Date.now();

  const app = await NestFactory.create(AppModule, {
    bufferLogs: false,
    bodyParser: false,
  });

  const loggerService = app.get(LoggerService);
  app.useLogger(loggerService);

  const configService = app.get(ConfigService);
  const isProd = configService.get<string>('app.env') === 'production';

  // CORS_ORIGIN is a comma-separated allowlist (app.config.ts defaults it to
  // '*' outside production for local-dev convenience, and '' -- meaning
  // nothing allowed until explicitly configured -- in production). Reflecting
  // every request's Origin unconditionally (the previous behavior here)
  // combined with credentials:true let any website make authenticated
  // cross-origin requests against this API using a signed-in visitor's
  // session, regardless of what CORS_ORIGIN was actually set to.
  const corsOrigins = configService
    .get<string>('app.cors.origin', '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const corsAllowAny = corsOrigins.includes('*');

  app.enableCors({
    origin: (
      requestOrigin: string | undefined,
      callback: (err: Error | null, origin?: any) => void,
    ) => {
      if (
        corsAllowAny ||
        !requestOrigin ||
        corsOrigins.includes(requestOrigin)
      ) {
        callback(null, requestOrigin || true);
        return;
      }
      callback(new Error(`Origin ${requestOrigin} not allowed by CORS`), false);
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Accept',
      'Authorization',
      'x-correlation-id',
      'x-request-id',
      'x-requested-with',
      'Origin',
      'X-Requested-With',
    ],
    credentials: true,
    optionsSuccessStatus: 204,
  });

  const helmetCsp = configService.get<boolean>(
    'app.security.helmetCspEnabled',
    true,
  );
  const helmetCoep = configService.get<boolean>(
    'app.security.helmetCoepEnabled',
    true,
  );

  app.use(
    helmet({
      contentSecurityPolicy: isProd && helmetCsp ? undefined : false,
      crossOriginEmbedderPolicy: isProd && helmetCoep,
      crossOriginResourcePolicy: false,
    }),
  );

  const expressInstance = app.getHttpAdapter().getInstance();
  const proxyCount = configService.get<number>(
    'app.security.trustProxyCount',
    1,
  );
  expressInstance.set('trust proxy', proxyCount);

  const jsonLimit = configService.get<string>(
    'app.security.bodyJsonLimit',
    SECURITY_CONSTANTS.MAX_JSON_SIZE,
  );
  const urlencodedLimit = configService.get<string>(
    'app.security.bodyUrlencodedLimit',
    SECURITY_CONSTANTS.MAX_URLENCODED_SIZE,
  );
  app.use(
    json({
      limit: jsonLimit,
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );
  app.use(urlencoded({ extended: true, limit: urlencodedLimit }));

  app.use(cookieParser());
  app.use(compression());

  // Crawlers and browsers ask every host for these two. This is an API, so
  // answer once here rather than let each request fall through to the 404
  // handler and fill the logs with errors that are not errors.
  app.use('/robots.txt', (_req: any, res: any) => {
    res.type('text/plain').send('User-agent: *\nDisallow: /\n');
  });
  app.use('/favicon.ico', (_req: any, res: any) => res.status(204).end());

  app.setGlobalPrefix('api/v1', {
    exclude: ['/', 'health', 'api/docs'],
  });

  app.enableShutdownHooks();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        const messages = errors.map(
          (err) =>
            `${err.property}: ${Object.values(err.constraints || {}).join(', ')}`,
        );
        return new ValidationException(messages.join('; '), 'INVALID_INPUT', {
          validationErrors: messages,
        });
      },
    }),
  );

  setupSwagger(app, configService);

  const port = process.env.PORT
    ? parseInt(process.env.PORT, 10)
    : configService.get<number>('app.port', 4000) || 4000;

  console.log(`[BOOTSTRAP] Attempting to listen on 0.0.0.0:${port}...`);
  await app.listen(port, '0.0.0.0');
  console.log(
    `[BOOTSTRAP] Server successfully listening on http://0.0.0.0:${port}`,
  );

  const startupDashboardService = app.get(StartupDashboardService);
  await startupDashboardService.printDashboard(startTime);
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrapping exception occurred:', err);
  process.exit(1);
});
