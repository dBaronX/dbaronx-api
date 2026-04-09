//apps/api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  const allowedOrigins = [
    'https://dbaronx.com',
    'https://www.dbaronx.com',
    'http://localhost:3000',
    'http://localhost:3001',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      try {
        const url = new URL(origin);
        const isAllowed =
          allowedOrigins.includes(origin) ||
          /\.onrender\.com$/i.test(url.hostname);

        if (isAllowed) return callback(null, true);

        return callback(new Error(`CORS blocked for origin: ${origin}`), false);
      } catch {
        return callback(new Error(`Invalid origin: ${origin}`), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature'],
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  await app.listen(port, '0.0.0.0');
  console.log(`dBaronX API running on port ${port}`);
}

bootstrap();