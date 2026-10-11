import type { INestApplication } from '@nestjs/common';
import { AppExceptionFilter } from './common/filters/app-exception.filter.js';
import { createValidationPipe } from './common/pipes/validation.pipe.js';

/** Shared by main.ts and e2e tests so both run the exact same pipeline. */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new AppExceptionFilter());
  app.enableCors();
}
