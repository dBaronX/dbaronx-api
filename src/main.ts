//apps/api/src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Render requires listening on process.env.PORT
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.enableCors({
    origin: [
      'https://dbaronx.com',
      'http://localhost:3000',
      'http://localhost:3001',
      'https://*.onrender.com',
    ],
    credentials: true,
  });

  await app.listen(port);
  console.log(`API is running on port ${port}`);
}

bootstrap();