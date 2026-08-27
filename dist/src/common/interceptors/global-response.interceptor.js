"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalResponseInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const logger_context_1 = require("../logger/logger.context");
const constants_1 = require("../constants");
let GlobalResponseInterceptor = class GlobalResponseInterceptor {
    intercept(context, next) {
        const ctx = context.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        if (request.url.includes('/health') || request.url.includes('/api/docs')) {
            return next.handle();
        }
        return next.handle().pipe((0, operators_1.map)((res) => {
            let statusCode = response.statusCode || common_1.HttpStatus.OK;
            let message = 'Request processed successfully';
            let data = res;
            let pagination = undefined;
            let customMeta = undefined;
            if (res && typeof res === 'object') {
                const payload = res;
                if ('statusCode' in payload &&
                    'message' in payload &&
                    'data' in payload) {
                    statusCode = payload['statusCode'];
                    message = payload['message'];
                    data = payload['data'];
                    response.status(statusCode);
                    const cMeta = payload['customMeta'];
                    if (cMeta) {
                        customMeta = cMeta;
                        if (cMeta['pagination']) {
                            pagination = cMeta['pagination'];
                        }
                    }
                }
            }
            const store = logger_context_1.loggerContextStorage.getStore();
            const correlationId = store?.requestId ||
                request.headers['x-correlation-id'] ||
                '';
            return {
                success: true,
                statusCode,
                message,
                data: data === undefined ? null : data,
                meta: {
                    timestamp: new Date().toISOString(),
                    correlationId,
                    path: request.url,
                    apiVersion: constants_1.APP_METADATA.API_PREFIX,
                    ...(customMeta ? { ...customMeta } : {}),
                    ...(pagination ? { pagination } : {}),
                },
            };
        }));
    }
};
exports.GlobalResponseInterceptor = GlobalResponseInterceptor;
exports.GlobalResponseInterceptor = GlobalResponseInterceptor = __decorate([
    (0, common_1.Injectable)()
], GlobalResponseInterceptor);
//# sourceMappingURL=global-response.interceptor.js.map