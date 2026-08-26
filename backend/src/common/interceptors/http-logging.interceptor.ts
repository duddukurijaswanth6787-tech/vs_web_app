import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as http from 'http';
import crypto from 'crypto';
import { LoggerService } from '../logger/logger.service';
import {
  HTTP_LOG_CONTEXT_SYMBOL,
  HttpLoggingContext,
} from '../logging/http-log-context';

/**
 * A routine 200 that returned quickly tells you nothing you would go looking
 * for, and on a live storefront those are almost all of the traffic. Failures
 * and slow requests are the ones worth the log line.
 */
export function isResponseWorthLogging({
  logSuccess,
  statusCode,
  durationMs,
  slowMs,
}: {
  logSuccess: boolean;
  statusCode: number;
  durationMs: number;
  slowMs: number;
}): boolean {
  return logSuccess || statusCode >= 400 || durationMs >= slowMs;
}

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();

    // Skip interception if not an HTTP request (e.g. microservice/ws/etc)
    if (!request || !request.method) {
      return next.handle();
    }

    let logCtx = request[HTTP_LOG_CONTEXT_SYMBOL] as HttpLoggingContext;
    if (!logCtx) {
      logCtx = {
        requestId: crypto.randomUUID(),
        startTime: process.hrtime.bigint(),
        incomingLogged: false,
        errorLogged: false,
      };
      request[HTTP_LOG_CONTEXT_SYMBOL] = logCtx;
    }

    logCtx.controller = context.getClass().name;
    logCtx.handler = context.getHandler().name;

    const isLogEnabled = this.configService.get<boolean>(
      'app.httpLog.enabled',
      true,
    );
    const path = request.originalUrl || request.url;
    const isHealthPath =
      path.includes('/health') || path.includes('/api/v1/health');
    const isHealthLogged = this.configService.get<boolean>(
      'app.httpLog.healthRequests',
      false,
    );
    const shouldLog = isLogEnabled && (!isHealthPath || isHealthLogged);
    const logSuccess = this.configService.get<boolean>(
      'app.httpLog.successRequests',
      true,
    );
    const slowMs = this.configService.get<number>(
      'app.monitoring.slowRequestThreshold',
      1000,
    );

    // The incoming line is only emitted up front when logging everything.
    // Otherwise it would defeat the point: whether a request is worth logging
    // is not known until it has a status and a duration. Nothing is lost --
    // the response line below carries the same fields, and a request that
    // dies before producing one is logged by the global exception filter.
    if (shouldLog && logSuccess && !logCtx.incomingLogged) {
      this.loggerService.logHttpRequest(logCtx, request);
      logCtx.incomingLogged = true;
    }

    return next.handle().pipe(
      tap({
        next: (body) => {
          if (shouldLog) {
            const response = ctx.getResponse();
            const durationNs = process.hrtime.bigint() - logCtx.startTime;
            const durationMs = Number(durationNs) / 1_000_000;
            const statusCode = response.statusCode || 200;
            const statusText = http.STATUS_CODES[statusCode] || '';

            if (
              !isResponseWorthLogging({
                logSuccess,
                statusCode,
                durationMs,
                slowMs,
              })
            ) {
              return;
            }

            this.loggerService.logHttpResponse(
              logCtx,
              request,
              statusCode,
              statusText,
              body,
              Math.round(durationMs),
            );
          }
        },
      }),
    );
  }
}
