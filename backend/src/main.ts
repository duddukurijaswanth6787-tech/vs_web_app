console.log('[STARTUP] Executing main.ts module script...');

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import compression from 'compression';
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

  const corsOrigin = configService.get<string>('app.cors.origin', '*');
  const corsMethods = configService.get<string>(
    'app.cors.methods',
    'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  );
  const corsHeaders = configService.get<string>('app.cors.allowedHeaders', '*');

  app.enableCors({
    origin: (
      requestOrigin: string | undefined,
      callback: (err: Error | null, origin?: any) => void,
    ) => {
      if (
        !requestOrigin ||
        corsOrigin === '*' ||
        !isProd ||
        corsOrigin.includes(requestOrigin) ||
        requestOrigin.includes('vercel.app')
      ) {
        callback(null, requestOrigin || true);
      } else {
        callback(null, requestOrigin || true);
      }
    },
    methods: corsMethods.split(',').map((s) => s.trim()),
    allowedHeaders:
      corsHeaders === '*'
        ? [
            'Content-Type',
            'Accept',
            'Authorization',
            'x-correlation-id',
            'x-request-id',
            'x-requested-with',
            'Origin',
            'X-Requested-With',
          ]
        : corsHeaders.split(',').map((s) => s.trim()),
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

  app.use(compression());

  app.setGlobalPrefix('api/v1', {
    exclude: ['health', 'api/docs'],
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

  const port = configService.get<number>('app.port', 4000);

  console.log(`[BOOTSTRAP] Attempting to listen on 0.0.0.0:${port}...`);
  await app.listen(port, '0.0.0.0');
  console.log(`[BOOTSTRAP] Server successfully listening on http://0.0.0.0:${port}`);

  const startupDashboardService = app.get(StartupDashboardService);
  await startupDashboardService.printDashboard(startTime);
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrapping exception occurred:', err);
  process.exit(1);
});
