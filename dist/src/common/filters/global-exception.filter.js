"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const http = __importStar(require("http"));
const crypto_1 = __importDefault(require("crypto"));
const exceptions_1 = require("../exceptions");
const logger_service_1 = require("../logger/logger.service");
const http_log_context_1 = require("../logging/http-log-context");
const http_log_serializer_1 = require("../logging/http-log-serializer");
let GlobalExceptionFilter = class GlobalExceptionFilter {
    configService;
    loggerService;
    constructor(configService, loggerService) {
        this.configService = configService;
        this.loggerService = loggerService;
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        if (exception instanceof common_1.HttpException &&
            (exception.getStatus() === 503 ||
                (request.url && request.url.includes('/health')))) {
            const status = exception.getStatus();
            const resObj = exception.getResponse();
            const correlationId = request[http_log_context_1.HTTP_LOG_CONTEXT_SYMBOL]?.requestId ||
                crypto_1.default.randomUUID();
            response.setHeader('x-correlation-id', correlationId);
            response.setHeader('x-request-id', correlationId);
            response.status(status).json(resObj);
            return;
        }
        const baseException = exceptions_1.GlobalExceptionMapper.map(exception);
        const status = baseException.getStatus();
        const errorCode = baseException.errorCode;
        const message = baseException.message;
        const metadata = baseException.metadata;
        let logCtx = request[http_log_context_1.HTTP_LOG_CONTEXT_SYMBOL];
        if (!logCtx) {
            const rawIncomingId = request.headers['x-correlation-id'] ||
                request.headers['x-request-id'] ||
                '';
            const validatedId = (0, http_log_serializer_1.validateAndSanitizeRequestId)(rawIncomingId);
            const correlationId = validatedId || crypto_1.default.randomUUID();
            logCtx = {
                requestId: correlationId,
                startTime: process.hrtime.bigint(),
                incomingLogged: false,
                errorLogged: false,
            };
            request[http_log_context_1.HTTP_LOG_CONTEXT_SYMBOL] = logCtx;
        }
        const isLogEnabled = this.configService.get('app.httpLog.enabled', true);
        const path = request.originalUrl || request.url;
        const isHealthPath = path.includes('/health') || path.includes('/api/v1/health');
        const isHealthLogged = this.configService.get('app.httpLog.healthRequests', false);
        const shouldLog = isLogEnabled && (!isHealthPath || isHealthLogged);
        if (shouldLog && !logCtx.incomingLogged) {
            this.loggerService.logHttpRequest(logCtx, request);
            logCtx.incomingLogged = true;
        }
        const durationNs = process.hrtime.bigint() - logCtx.startTime;
        const durationMs = Number(durationNs) / 1_000_000;
        const statusText = http.STATUS_CODES[status] || '';
        const errorResponse = {
            success: false,
            error: baseException.name || 'HttpException',
            code: errorCode,
            message,
            timestamp: baseException.timestamp,
            correlationId: logCtx.requestId,
            path: request.url,
            metadata: metadata || {},
        };
        const isProd = this.configService.get('app.env') === 'production';
        if (shouldLog && !logCtx.errorLogged) {
            this.loggerService.logHttpError(logCtx, request, status, statusText, baseException.name || 'HttpException', message, errorResponse, Math.round(durationMs), isProd ? undefined : baseException.stack);
            logCtx.errorLogged = true;
        }
        response.setHeader('x-correlation-id', logCtx.requestId);
        response.setHeader('x-request-id', logCtx.requestId);
        response.status(status).json(errorResponse);
    }
};
exports.GlobalExceptionFilter = GlobalExceptionFilter;
exports.GlobalExceptionFilter = GlobalExceptionFilter = __decorate([
    (0, common_1.Catch)(),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        logger_service_1.LoggerService])
], GlobalExceptionFilter);
//# sourceMappingURL=global-exception.filter.js.map