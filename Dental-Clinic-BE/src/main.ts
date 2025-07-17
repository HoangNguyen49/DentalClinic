import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import * as express from 'express';
import { resolve } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const frontendUrl = configService.get<string>('FRONTEND_URL');

  // Enable CORS
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  // Use validation globally
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // Serve static files (uploaded avatars) from the 'uploads' folder
  app.use('/uploads', express.static(resolve('uploads')));

  await app.listen(3000);
}
bootstrap();
