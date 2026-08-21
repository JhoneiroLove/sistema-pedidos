import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { timingSafeEqual } from 'node:crypto';

import type { AuthenticatedRequest } from './authenticated-request.js';
import { IS_PUBLIC_KEY } from './public.decorator.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (SAFE_METHODS.has(request.method) || !request.authViaCookie) return true;

    this.validateOrigin(request);

    const cookies = request.cookies as Record<string, unknown> | undefined;
    const cookieToken = cookies?.csrf_token;
    const headerToken = request.headers['x-csrf-token'];
    if (
      typeof cookieToken !== 'string' ||
      typeof headerToken !== 'string' ||
      !this.tokensMatch(cookieToken, headerToken)
    ) {
      throw new ForbiddenException('Token CSRF inválido o ausente');
    }

    return true;
  }

  private validateOrigin(request: AuthenticatedRequest): void {
    const origin = request.headers.origin;
    if (!origin) return;

    const allowedOrigins = this.config
      .getOrThrow<string>('CORS_ORIGINS')
      .split(',')
      .map((value) => value.trim());

    if (!allowedOrigins.includes(origin)) {
      throw new ForbiddenException('Origen no permitido');
    }
  }

  private tokensMatch(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);
    return (
      leftBuffer.length === rightBuffer.length &&
      timingSafeEqual(leftBuffer, rightBuffer)
    );
  }
}
