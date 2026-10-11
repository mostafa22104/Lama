import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { AppError } from '../errors/app-error.js';
import { AccessTokenService } from './access-token.service.js';
import type { AuthenticatedRequest } from './authenticated-request.js';

function extractBearer(header: string | undefined): string | null {
  const [scheme, token] = header?.split(' ') ?? [];
  return scheme === 'Bearer' && token ? token : null;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly accessTokens: AccessTokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractBearer(request.headers.authorization);
    if (!token) throw new AppError('UNAUTHORIZED', 'Missing bearer token');
    request.businessId = this.accessTokens.verify(token).sub;
    return true;
  }
}
