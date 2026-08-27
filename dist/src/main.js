"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
console.log('[STARTUP] Executing main.ts module script v1.0.1 (AWS Billing Enabled)...');
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_1 = require("express");
const helmet_1 = __importDefault(require("helmet"));
const logger_service_1 = require("./common/logger/logger.service");
const app_module_1 = require("./core/app.module");
const startup_service_1 = require("./common/startup/startup.service");
const swagger_config_1 = require("./core/swagger/swagger.config");
const exceptions_1 = require("./common/exceptions");
const security_1 = require("./common/security");
async function bootstrap() {
    console.log('[BOOTSTRAP] Starting NestJS Application...');
    const startTime = Date.now();
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        bufferLogs: false,
        bodyParser: false,
    });
    const loggerService = app.get(logger_service_1.LoggerService);
    app.useLogger(loggerService);
    const configService = app.get(config_1.ConfigService);
    const isProd = configService.get('app.env') === 'production';
    const corsOrigins = configService
        .get('app.cors.origin', '')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);
    const corsAllowAny = corsOrigins.includes('*');
    app.enableCors({
        origin: (requestOrigin, callback) => {
            if (corsAllowAny ||
                !requestOrigin ||
                corsOrigins.includes(requestOrigin)) {
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
    const helmetCsp = configService.get('app.security.helmetCspEnabled', true);
    const helmetCoep = configService.get('app.security.helmetCoepEnabled', true);
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: isProd && helmetCsp ? undefined : false,
        crossOriginEmbedderPolicy: isProd && helmetCoep,
        crossOriginResourcePolicy: false,
    }));
    const expressInstance = app.getHttpAdapter().getInstance();
    const proxyCount = configService.get('app.security.trustProxyCount', 1);
    expressInstance.set('trust proxy', proxyCount);
    const jsonLimit = configService.get('app.security.bodyJsonLimit', security_1.SECURITY_CONSTANTS.MAX_JSON_SIZE);
    const urlencodedLimit = configService.get('app.security.bodyUrlencodedLimit', security_1.SECURITY_CONSTANTS.MAX_URLENCODED_SIZE);
    app.use((0, express_1.json)({
        limit: jsonLimit,
        verify: (req, _res, buf) => {
            req.rawBody = buf;
        },
    }));
    app.use((0, express_1.urlencoded)({ extended: true, limit: urlencodedLimit }));
    app.use((0, cookie_parser_1.default)());
    app.use((0, compression_1.default)());
    app.use('/robots.txt', (_req, res) => {
        res.type('text/plain').send('User-agent: *\nDisallow: /\n');
    });
    app.use('/favicon.ico', (_req, res) => res.status(204).end());
    app.setGlobalPrefix('api/v1', {
        exclude: ['/', 'health', 'api/docs'],
    });
    app.enableShutdownHooks();
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        exceptionFactory: (errors) => {
            const messages = errors.map((err) => `${err.property}: ${Object.values(err.constraints || {}).join(', ')}`);
            return new exceptions_1.ValidationException(messages.join('; '), 'INVALID_INPUT', {
                validationErrors: messages,
            });
        },
    }));
    (0, swagger_config_1.setupSwagger)(app, configService);
    const port = process.env.PORT
        ? parseInt(process.env.PORT, 10)
        : configService.get('app.port', 4000) || 4000;
    console.log(`[BOOTSTRAP] Attempting to listen on 0.0.0.0:${port}...`);
    await app.listen(port, '0.0.0.0');
    console.log(`[BOOTSTRAP] Server successfully listening on http://0.0.0.0:${port}`);
    const startupDashboardService = app.get(startup_service_1.StartupDashboardService);
    await startupDashboardService.printDashboard(startTime);
}
bootstrap().catch((err) => {
    console.error('Fatal bootstrapping exception occurred:', err);
    process.exit(1);
});
//# sourceMappingURL=main.js.map