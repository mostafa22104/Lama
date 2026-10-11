import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';
import { ENV, type Env } from './config/env.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  await app.listen(app.get<Env>(ENV).PORT);
}

await bootstrap();
