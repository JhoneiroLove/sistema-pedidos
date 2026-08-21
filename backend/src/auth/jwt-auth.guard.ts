import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import type {
  AuthenticatedRequest,
  JwtPayload,
} from './authenticated-request.js';
import { IS_PUBLIC_KEY } from './public.decorator.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const bearerToken = this.extractBearerToken(request);
    const cookies = request.cookies as Record<string, unknown> | undefined;
    const cookieToken = cookies?.access_token;
    const token =
      bearerToken ??
      (typeof cookieToken === 'string' ? cookieToken : undefined);

    if (!token) throw new UnauthorizedException('Autenticación requerida');

    try {
      request.user = await this.jwtService.verifyAsync<JwtPayload>(token);
      request.authViaCookie = !bearerToken;
    } catch {
      throw new UnauthorizedException('Token inválido o vencido');
    }

    return true;
  }

  private extractBearerToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
