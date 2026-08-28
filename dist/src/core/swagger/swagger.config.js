"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwagger = setupSwagger;
const swagger_1 = require("@nestjs/swagger");
const constants_1 = require("../../common/constants");
function setupSwagger(app, configService) {
    if (!configService.get('app.features.swagger', true))
        return;
    const config = new swagger_1.DocumentBuilder()
        .setTitle(constants_1.APP_METADATA.NAME)
        .setDescription("Enterprise-grade Women's Fashion E-commerce Platform API")
        .setVersion(constants_1.APP_METADATA.VERSION)
        .setContact("Vasanthi's Signature", 'https://vasanthissignature.in', 'support@vasanthissignature.in')
        .setLicense('UNLICENSED', '')
        .addServer(configService.get('app.env') === 'production'
        ? 'https://api.vasanthissignature.in'
        : `http://localhost:${configService.get('app.port', 4000)}`)
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT authorization token',
        in: 'header',
    }, 'JWT-auth')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
        },
    });
}
//# sourceMappingURL=swagger.config.js.map