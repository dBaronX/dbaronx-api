import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = [
    'https://dbaronx.com',
    'https://www.dbaronx.com',
    'http://localhost:3000',
    'http://localhost:3001',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      try {
        const url = new URL(origin);
        const allowed =
          allowedOrigins.includes(origin) ||
          /\.onrender\.com$/i.test(url.hostname);

        if (allowed) {
          return callback(null, true);
        }

        return callback(new Error(`Blocked by CORS: ${origin}`), false);
      } catch {
        return callback(new Error(`Invalid CORS origin: ${origin}`), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  await app.listen(port, '0.0.0.0');

  console.log(`dBaronX NestJS gateway running on port ${port}`);
}

bootstrap();