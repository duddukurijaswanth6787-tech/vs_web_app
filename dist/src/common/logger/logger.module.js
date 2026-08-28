"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nestjs_pino_1 = require("nestjs-pino");
const logger_service_1 = require("./logger.service");
let LoggerModule = class LoggerModule {
};
exports.LoggerModule = LoggerModule;
exports.LoggerModule = LoggerModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            nestjs_pino_1.LoggerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => {
                    const isProd = configService.get('app.env') === 'production';
                    const isLoggerEnabled = configService.get('app.features.logger', true);
                    return {
                        pinoHttp: {
                            level: isProd ? 'info' : 'debug',
                            enabled: isLoggerEnabled,
                            autoLogging: false,
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
                            serializers: {
                                req: (req) => {
                                    const request = req;
                                    return {
                                        id: request.id,
                                        method: request.method,
                                        url: request.url,
                                    };
                                },
                                res: (res) => {
                                    const response = res;
                                    return {
                                        statusCode: response.statusCode,
                                    };
                                },
                                err: (err) => {
                                    const error = err;
                                    return {
                                        type: error.name,
                                        message: error.message,
                                        stack: error.stack,
                                    };
                                },
                            },
                            customSuccessMessage: (req, res, responseTime) => {
                                const request = req;
                                const response = res;
                                return `${request.method} ${request.url} - ${response.statusCode} in ${responseTime}ms`;
                            },
                            customErrorMessage: (req, res, err) => {
                                const request = req;
                                const response = res;
                                return `${request.method} ${request.url} - ${response.statusCode} - Error: ${err.message}`;
                            },
                        },
                    };
                },
                inject: [config_1.ConfigService],
            }),
        ],
        providers: [logger_service_1.LoggerService],
        exports: [nestjs_pino_1.LoggerModule, logger_service_1.LoggerService],
    })
], LoggerModule);
//# sourceMappingURL=logger.module.js.map