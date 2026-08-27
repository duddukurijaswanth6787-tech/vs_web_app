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
exports.SecurityEventService = exports.SecurityEventType = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const logger_service_1 = require("../logger/logger.service");
var SecurityEventType;
(function (SecurityEventType) {
    SecurityEventType["RATE_LIMIT_VIOLATION"] = "RATE_LIMIT_VIOLATION";
    SecurityEventType["INVALID_CORRELATION_ID"] = "INVALID_CORRELATION_ID";
    SecurityEventType["CORS_VIOLATION"] = "CORS_VIOLATION";
    SecurityEventType["SUSPICIOUS_REQUEST"] = "SUSPICIOUS_REQUEST";
})(SecurityEventType || (exports.SecurityEventType = SecurityEventType = {}));
let SecurityEventService = class SecurityEventService {
    configService;
    loggerService;
    enabled;
    constructor(configService, loggerService) {
        this.configService = configService;
        this.loggerService = loggerService;
        this.enabled = this.configService.get('app.security.eventLogEnabled', true);
    }
    log(event) {
        if (!this.enabled)
            return;
        this.loggerService.warn({
            securityEvent: event.type,
            ip: event.ip,
            path: event.path,
            method: event.method,
            correlationId: event.correlationId,
            userAgent: event.userAgent,
            ...event.metadata,
        }, 'SecurityEvent');
    }
};
exports.SecurityEventService = SecurityEventService;
exports.SecurityEventService = SecurityEventService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        logger_service_1.LoggerService])
], SecurityEventService);
//# sourceMappingURL=security-event.service.js.map