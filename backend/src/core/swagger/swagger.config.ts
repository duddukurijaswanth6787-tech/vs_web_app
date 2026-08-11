import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { APP_METADATA } from '@common/constants';

export function setupSwagger(
  app: INestApplication,
  configService: ConfigService,
): void {
  if (!configService.get<boolean>('app.features.swagger', true)) return;

  const config = new DocumentBuilder()
    .setTitle(APP_METADATA.NAME)
    .setDescription("Enterprise-grade Women's Fashion E-commerce Platform API")
    .setVersion(APP_METADATA.VERSION)
    .setContact(
      "Vasanthi's Signature",
      'https://vasanthissignature.in',
      'support@vasanthissignature.in',
    )
    .setLicense('UNLICENSED', '')
    .addServer(
      configService.get<string>('app.env') === 'production'
        ? 'https://api.vasanthissignature.in'
        : `http://localhost:${configService.get<number>('app.port', 4000)}`,
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT authorization token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}
