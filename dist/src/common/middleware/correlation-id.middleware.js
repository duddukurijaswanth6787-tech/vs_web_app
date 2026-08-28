"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CorrelationIdMiddleware = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = __importDefault(require("crypto"));
const logger_context_1 = require("../logger/logger.context");
const http_log_serializer_1 = require("../logging/http-log-serializer");
const http_log_context_1 = require("../logging/http-log-context");
let CorrelationIdMiddleware = class CorrelationIdMiddleware {
    use(req, res, next) {
        const rawIncomingId = req.headers['x-correlation-id'] ||
            req.headers['x-request-id'] ||
            '';
        const validatedId = (0, http_log_serializer_1.validateAndSanitizeRequestId)(rawIncomingId);
        const correlationId = validatedId || crypto_1.default.randomUUID();
        res.setHeader('x-correlation-id', correlationId);
        res.setHeader('x-request-id', correlationId);
        const logCtx = {
            requestId: correlationId,
            startTime: process.hrtime.bigint(),
            incomingLogged: false,
            errorLogged: false,
        };
        req[http_log_context_1.HTTP_LOG_CONTEXT_SYMBOL] = logCtx;
        const context = {
            requestId: correlationId,
            ip: req.ip || req.socket.remoteAddress || '',
            userAgent: req.headers['user-agent'] || '',
        };
        logger_context_1.loggerContextStorage.run(context, () => {
            next();
        });
    }
};
exports.CorrelationIdMiddleware = CorrelationIdMiddleware;
exports.CorrelationIdMiddleware = CorrelationIdMiddleware = __decorate([
    (0, common_1.Injectable)()
], CorrelationIdMiddleware);
//# sourceMappingURL=correlation-id.middleware.js.map