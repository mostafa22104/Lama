import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../../src/app.module.js';
import { configureApp } from '../../src/app.setup.js';
import { PrismaService } from '../../src/infra/prisma/prisma.service.js';
import { OtpSender } from '../../src/modules/auth/otp/otp-sender.js';
import { FakeOtpSender } from '../../src/testing/fake-otp-sender.js';
import { resetDatabase } from './reset-database.js';

export interface TestApp {
  app: INestApplication<App>;
  prisma: PrismaService;
  otpSender: FakeOtpSender;
  api: () => ReturnType<typeof request>;
}

export async function createTestApp(): Promise<TestApp> {
  const otpSender = new FakeOtpSender();
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(OtpSender)
    .useValue(otpSender)
    .compile();
  const app = moduleRef.createNestApplication<INestApplication<App>>();
  configureApp(app);
  await app.init();

  const prisma = app.get(PrismaService);
  await resetDatabase(prisma);
  return { app, prisma, otpSender, api: () => request(app.getHttpServer()) };
}
