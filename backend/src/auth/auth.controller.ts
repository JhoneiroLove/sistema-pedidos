import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';

import type { AuthenticatedRequest } from './authenticated-request.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegistroDto } from './dto/registro.dto.js';
import { Public } from './public.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('registro')
  registrar(@Body() dto: RegistroDto) {
    return this.authService.registrar(dto);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(dto.email, dto.password);
    const csrfToken = randomBytes(32).toString('base64url');
    const secure = this.config.get<string>('NODE_ENV') === 'production';
    const cookieBase = { secure, sameSite: 'lax' as const, path: '/' };

    response.cookie('access_token', result.accessToken, {
      ...cookieBase,
      httpOnly: true,
      maxAge: 15 * 60 * 1000,
    });
    response.cookie('csrf_token', csrfToken, {
      ...cookieBase,
      httpOnly: false,
      maxAge: 15 * 60 * 1000,
    });

    return {
      accessToken: result.accessToken,
      csrfToken,
      tokenType: 'Bearer',
      expiresIn: 900,
      cliente: result.cliente,
    };
  }

  @Get('me')
  me(@Req() request: AuthenticatedRequest) {
    return request.user;
  }

  @Post('logout')
  logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.clearCookie('access_token', { path: '/' });
    response.clearCookie('csrf_token', { path: '/' });
    return { mensaje: 'Sesión cerrada correctamente' };
  }
}
