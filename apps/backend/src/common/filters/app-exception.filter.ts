import { type ArgumentsHost, Catch, type ExceptionFilter, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { toErrorResponse } from './to-error-response.js';

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AppExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const { status, body } = toErrorResponse(exception);
    if (status >= 500) this.logger.error(exception);
    host.switchToHttp().getResponse<Response>().status(status).json(body);
  }
}
