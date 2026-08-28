"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const pino_1 = require("pino");
const logger_context_1 = require("./logger.context");
const logger_utils_1 = require("../utils/logger.utils");
const http_log_serializer_1 = require("../logging/http-log-serializer");
let LoggerService = class LoggerService {
    configService;
    pinoLogger;
    isLoggerEnabled = true;
    constructor(configService) {
        this.configService = configService;
        this.init();
    }
    init() {
        this.isLoggerEnabled = this.configService.get('app.features.logger', true);
        const env = this.configService.get('app.env', 'development');
        const isProd = env === 'production';
        this.pinoLogger = (0, pino_1.pino)({
            level: isProd ? 'info' : 'debug',
            enabled: this.isLoggerEnabled,
            transport: isProd
                ? undefined
                : {
                    target: 'pino-pretty',
                    options: {
                        singleLine: true,
                        colorize: true,
                        translateTime: 'SYS:standard',
                    },
                },
        });
    }
    getContextData(context) {
        const store = logger_context_1.loggerContextStorage.getStore();
        return {
            requestId: store?.requestId,
            ip: store?.ip,
            userAgent: store?.userAgent,
            context: context || 'Application',
            environment: this.configService.get('app.env', 'development'),
            version: '1.0.0',
        };
    }
    shouldSuppress(context) {
        if (!context)
            return false;
        const env = this.configService.get('app.env', 'development');
        if (env !== 'development')
            return false;
        const suppressed = [
            'InstanceLoader',
            'RoutesResolver',
            'RouterExplorer',
            'LegacyRouteConverter',
            'NestFactory',
            'NestApplication',
            'RagAgentService',
            'PrismaService',
            'RedisService',
        ];
        return suppressed.includes(context);
    }
    log(message, context) {
        if (this.shouldSuppress(context))
            return;
        if (!this.isLoggerEnabled)
            return;
        const ctxData = this.getContextData(context);
        const masked = (0, logger_utils_1.maskSensitiveData)(message);
        const isStr = typeof masked === 'string';
        this.pinoLogger.info({
            ...ctxData,
            msg: isStr ? masked : undefined,
            data: !isStr ? masked : undefined,
        });
    }
    error(message, trace, context) {
        if (!this.isLoggerEnabled)
            return;
        const ctxData = this.getContextData(context);
        const masked = (0, logger_utils_1.maskSensitiveData)(message);
        const isStr = typeof masked === 'string';
        this.pinoLogger.error({
            ...ctxData,
            msg: isStr ? masked : undefined,
            data: !isStr ? masked : undefined,
            stack: trace,
        });
    }
    warn(message, context) {
        if (this.shouldSuppress(context))
            return;
        if (!this.isLoggerEnabled)
            return;
        const ctxData = this.getContextData(context);
        const masked = (0, logger_utils_1.maskSensitiveData)(message);
        const isStr = typeof masked === 'string';
        this.pinoLogger.warn({
            ...ctxData,
            msg: isStr ? masked : undefined,
            data: !isStr ? masked : undefined,
        });
    }
    debug(message, context) {
        if (this.shouldSuppress(context))
            return;
        if (!this.isLoggerEnabled)
            return;
        const ctxData = this.getContextData(context);
        const masked = (0, logger_utils_1.maskSensitiveData)(message);
        const isStr = typeof masked === 'string';
        this.pinoLogger.debug({
            ...ctxData,
            msg: isStr ? masked : undefined,
            data: !isStr ? masked : undefined,
        });
    }
    verbose(message, context) {
        if (this.shouldSuppress(context))
            return;
        if (!this.isLoggerEnabled)
            return;
        const ctxData = this.getContextData(context);
        const masked = (0, logger_utils_1.maskSensitiveData)(message);
        const isStr = typeof masked === 'string';
        this.pinoLogger.trace({
            ...ctxData,
            msg: isStr ? masked : undefined,
            data: !isStr ? masked : undefined,
        });
    }
    fatal(message, trace, context) {
        if (!this.isLoggerEnabled)
            return;
        const ctxData = this.getContextData(context);
        const masked = (0, logger_utils_1.maskSensitiveData)(message);
        const isStr = typeof masked === 'string';
        this.pinoLogger.fatal({
            ...ctxData,
            msg: isStr ? masked : undefined,
            data: !isStr ? masked : undefined,
            stack: trace,
        });
    }
    logHttpRequest(ctx, req) {
        if (!this.isLoggerEnabled)
            return;
        const isProd = this.configService.get('app.env') === 'production';
        const requestId = ctx.requestId;
        const method = req.method;
        const path = req.originalUrl || req.url;
        const controller = ctx.controller || 'UnknownController';
        const handler = ctx.handler || 'unknownHandler';
        const user = req.user;
        const userId = user?.sub || 'GUEST';
        const role = user?.roles?.join(', ') || 'GUEST';
        const ip = req.ip || req.socket.remoteAddress || '::1';
        if (isProd) {
            this.pinoLogger.info({
                event: 'http_request',
                requestId,
                method,
                path,
                controller,
                handler,
                userId,
                role,
                ip,
            });
            return;
        }
        const maxLen = this.configService.get('app.httpLog.maxBodyLength', 10000);
        const bodyStr = (0, http_log_serializer_1.formatAndTruncate)(req.body, maxLen);
        const queryStr = (0, http_log_serializer_1.formatAndTruncate)(req.query, maxLen);
        const paramsStr = (0, http_log_serializer_1.formatAndTruncate)(req.params, maxLen);
        let filesInfo = '';
        if (req.file) {
            filesInfo = `\n│ FILE        : ${JSON.stringify((0, http_log_serializer_1.redactObject)(req.file))}`;
        }
        else if (req.files) {
            filesInfo = `\n│ FILES       : ${JSON.stringify((0, http_log_serializer_1.redactObject)(req.files))}`;
        }
        const box = `┌──────────────────────────────────────────────────────────────
│ → INCOMING API REQUEST
├──────────────────────────────────────────────────────────────
│ METHOD      : ${method}
│ URL         : ${path}
│ REQUEST ID  : ${requestId}
│ CONTROLLER  : ${controller}
│ HANDLER     : ${handler}
│ USER ID     : ${userId}
│ ROLE        : ${role}
│ CLIENT IP   : ${ip}${filesInfo}
│
│ REQUEST BODY
${bodyStr
            .split('\n')
            .map((line) => `│ ${line}`)
            .join('\n')}
│
│ QUERY PARAMS
${queryStr
            .split('\n')
            .map((line) => `│ ${line}`)
            .join('\n')}
│
│ PATH PARAMS
${paramsStr
            .split('\n')
            .map((line) => `│ ${line}`)
            .join('\n')}
└──────────────────────────────────────────────────────────────`;
        console.log(box);
    }
    logHttpResponse(ctx, req, statusCode, statusText, body, durationMs) {
        if (!this.isLoggerEnabled)
            return;
        const isProd = this.configService.get('app.env') === 'production';
        const requestId = ctx.requestId;
        const method = req.method;
        const path = req.originalUrl || req.url;
        const controller = ctx.controller || 'UnknownController';
        const handler = ctx.handler || 'unknownHandler';
        const user = req.user;
        const userId = user?.sub || 'GUEST';
        const role = user?.roles?.join(', ') || 'GUEST';
        if (isProd) {
            this.pinoLogger.info({
                event: 'http_response',
                requestId,
                method,
                path,
                statusCode,
                durationMs,
                controller,
                handler,
                userId,
                role,
            });
            return;
        }
        const maxLen = this.configService.get('app.httpLog.maxBodyLength', 10000);
        const bodyStr = (0, http_log_serializer_1.formatAndTruncate)(body, maxLen);
        const box = `┌──────────────────────────────────────────────────────────────
│ ← API RESPONSE
├──────────────────────────────────────────────────────────────
│ METHOD      : ${method}
│ URL         : ${path}
│ STATUS      : ${statusCode} ${statusText}
│ DURATION    : ${durationMs} ms
│ REQUEST ID  : ${requestId}
│
│ RESPONSE BODY
${bodyStr
            .split('\n')
            .map((line) => `│ ${line}`)
            .join('\n')}
└──────────────────────────────────────────────────────────────`;
        console.log(box);
    }
    logHttpError(ctx, req, statusCode, statusText, errorName, errorMessage, errorResponse, durationMs, stack) {
        if (!this.isLoggerEnabled)
            return;
        const isProd = this.configService.get('app.env') === 'production';
        const requestId = ctx.requestId;
        const method = req.method;
        const path = req.originalUrl || req.url;
        if (isProd) {
            this.pinoLogger.error({
                event: 'http_error',
                requestId,
                method,
                path,
                statusCode,
                durationMs,
                errorName,
                message: errorMessage,
            });
            return;
        }
        const maxLen = this.configService.get('app.httpLog.maxBodyLength', 10000);
        const responseStr = (0, http_log_serializer_1.formatAndTruncate)(errorResponse, maxLen);
        const stackStr = stack || 'N/A';
        const box = `┌──────────────────────────────────────────────────────────────
│ ✕ API ERROR
├──────────────────────────────────────────────────────────────
│ METHOD      : ${method}
│ URL         : ${path}
│ STATUS      : ${statusCode} ${statusText}
│ DURATION    : ${durationMs} ms
│ REQUEST ID  : ${requestId}
│ ERROR       : ${errorName}
│ MESSAGE     : ${errorMessage}
│
│ ERROR RESPONSE
${responseStr
            .split('\n')
            .map((line) => `│ ${line}`)
            .join('\n')}
│
│ STACK TRACE
${stackStr
            .split('\n')
            .map((line) => `│ ${line}`)
            .join('\n')}
└──────────────────────────────────────────────────────────────`;
        console.log(box);
    }
};
exports.LoggerService = LoggerService;
exports.LoggerService = LoggerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], LoggerService);
//# sourceMappingURL=logger.service.js.map