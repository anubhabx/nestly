import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  });
  app.use(helmet());
  app.use(compression());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Specord Benchmark API')
    .setDescription(
      'Production-shaped NestJS fixture for source-first OpenAPI extraction.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .addApiKey(
      { type: 'apiKey', in: 'header', name: 'X-API-Key' },
      'apiKeyAuth',
    )
    .addApiKey(
      { type: 'apiKey', in: 'header', name: 'Stripe-Signature' },
      'stripeSignature',
    )
    .build();

  SwaggerModule.setup(
    'docs',
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
  );

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
