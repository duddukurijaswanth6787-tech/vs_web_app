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
exports.HttpLoggingInterceptor = void 0;
exports.isResponseWorthLogging = isResponseWorthLogging;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const operators_1 = require("rxjs/operators");
const http = __importStar(require("http"));
const crypto_1 = __importDefault(require("crypto"));
const logger_service_1 = require("../logger/logger.service");
const http_log_context_1 = require("../logging/http-log-context");
function isResponseWorthLogging({ logSuccess, statusCode, durationMs, slowMs, }) {
    return logSuccess || statusCode >= 400 || durationMs >= slowMs;
}
let HttpLoggingInterceptor = class HttpLoggingInterceptor {
    configService;
    loggerService;
    constructor(configService, loggerService) {
        this.configService = configService;
        this.loggerService = loggerService;
    }
    intercept(context, next) {
        const ctx = context.switchToHttp();
        const request = ctx.getRequest();
        if (!request || !request.method) {
            return next.handle();
        }
        let logCtx = request[http_log_context_1.HTTP_LOG_CONTEXT_SYMBOL];
        if (!logCtx) {
            logCtx = {
                requestId: crypto_1.default.randomUUID(),
                startTime: process.hrtime.bigint(),
                incomingLogged: false,
                errorLogged: false,
            };
            request[http_log_context_1.HTTP_LOG_CONTEXT_SYMBOL] = logCtx;
        }
        logCtx.controller = context.getClass().name;
        logCtx.handler = context.getHandler().name;
        const isLogEnabled = this.configService.get('app.httpLog.enabled', true);
        const path = request.originalUrl || request.url;
        const isHealthPath = path.includes('/health') || path.includes('/api/v1/health');
        const isHealthLogged = this.configService.get('app.httpLog.healthRequests', false);
        const shouldLog = isLogEnabled && (!isHealthPath || isHealthLogged);
        const logSuccess = this.configService.get('app.httpLog.successRequests', true);
        const slowMs = this.configService.get('app.monitoring.slowRequestThreshold', 1000);
        if (shouldLog && logSuccess && !logCtx.incomingLogged) {
            this.loggerService.logHttpRequest(logCtx, request);
            logCtx.incomingLogged = true;
        }
        return next.handle().pipe((0, operators_1.tap)({
            next: (body) => {
                if (shouldLog) {
                    const response = ctx.getResponse();
                    const durationNs = process.hrtime.bigint() - logCtx.startTime;
                    const durationMs = Number(durationNs) / 1_000_000;
                    const statusCode = response.statusCode || 200;
                    const statusText = http.STATUS_CODES[statusCode] || '';
                    if (!isResponseWorthLogging({
                        logSuccess,
                        statusCode,
                        durationMs,
                        slowMs,
                    })) {
                        return;
                    }
                    this.loggerService.logHttpResponse(logCtx, request, statusCode, statusText, body, Math.round(durationMs));
                }
            },
        }));
    }
};
exports.HttpLoggingInterceptor = HttpLoggingInterceptor;
exports.HttpLoggingInterceptor = HttpLoggingInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        logger_service_1.LoggerService])
], HttpLoggingInterceptor);
//# sourceMappingURL=http-logging.interceptor.js.map