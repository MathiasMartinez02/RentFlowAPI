import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { join } from 'path';
import * as compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  const port = configService.get<number>('app.port', 3000);
  const nodeEnv = configService.get<string>('app.nodeEnv', 'development');
  const swaggerEnabled = configService.get<boolean>('app.swaggerEnabled', true);
  const frontendUrl = configService.get<string>('app.frontendUrl', '*');

  // WebSocket adapter
  app.useWebSocketAdapter(new IoAdapter(app));

  // Static file serving for uploads
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  // Security middleware
  app.use(helmet());
  app.use(compression());

  // CORS
  app.enableCors({
    origin: frontendUrl === '*' ? true : frontendUrl.split(',').map((u) => u.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global prefix and versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  // Swagger documentation
  if (swaggerEnabled && nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('RentFlow API')
      .setDescription(
        `## Enterprise-grade rental management system\n\n` +
        `**Base URL:** \`/api/v1\`\n\n` +
        `Use the **Authorize** button to add your JWT token.\n\n` +
        `Format: \`Bearer <token>\``,
      )
      .setVersion('1.0.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
        'JWT-auth',
      )
      .addTag('Auth', 'Authentication — register & login')
      .addTag('Users', 'User profile management')
      .addTag('Properties', 'Property CRUD')
      .addTag('Tenants', 'Tenant management')
      .addTag('Contracts', 'Rental contract management')
      .addTag('Payments', 'Payment tracking')
      .addTag('Maintenance', 'Maintenance ticket system')
      .addTag('Notificaciones', 'In-app notifications')
      .addTag('Activity Feed', 'User activity log')
      .addTag('Uploads', 'File and image uploads')
      .addTag('Dashboard', 'Analytics & KPIs')
      .addTag('Health', 'Service health checks')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true, tagsSorter: 'alpha' },
    });
  }

  await app.listen(port);

  console.log(`\n🚀  RentFlow API  →  http://localhost:${port}/api/v1`);
  if (swaggerEnabled && nodeEnv !== 'production') {
    console.log(`📚  Swagger docs  →  http://localhost:${port}/api/docs`);
  }
  console.log(`🌍  Environment   →  ${nodeEnv}\n`);
}

bootstrap();
