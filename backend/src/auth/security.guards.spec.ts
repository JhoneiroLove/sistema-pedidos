import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { jest } from '@jest/globals';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

import { CsrfGuard } from './csrf.guard.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

describe('Guards de seguridad', () => {
  const mock = () => jest.fn<(...args: any[]) => any>();

  function context(request: Record<string, unknown>) {
    return {
      getHandler: mock(),
      getClass: mock(),
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  }

  it('autentica un bearer y adjunta el cliente al request', async () => {
    const jwt = { verifyAsync: mock() };
    const reflector = { getAllAndOverride: mock().mockReturnValue(false) };
    const payload = {
      sub: '7',
      clienteId: 7,
      email: 'ada@example.com',
      nombre: 'Ada',
    };
    jwt.verifyAsync.mockResolvedValue(payload);
    const request = { headers: { authorization: 'Bearer token-válido' } };
    const guard = new JwtAuthGuard(
      jwt as unknown as JwtService,
      reflector as unknown as Reflector,
    );

    await expect(guard.canActivate(context(request))).resolves.toBe(true);
    expect(request).toMatchObject({ user: payload, authViaCookie: false });
  });

  it('rechaza solicitudes sin JWT', async () => {
    const guard = new JwtAuthGuard(
      { verifyAsync: mock() } as unknown as JwtService,
      {
        getAllAndOverride: mock().mockReturnValue(false),
      } as unknown as Reflector,
    );

    await expect(
      guard.canActivate(context({ headers: {}, cookies: {} })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('exige coincidencia de cookie y header CSRF en mutaciones', () => {
    const guard = new CsrfGuard(
      {
        getOrThrow: mock().mockReturnValue('http://localhost:3001'),
      } as unknown as ConfigService,
      {
        getAllAndOverride: mock().mockReturnValue(false),
      } as unknown as Reflector,
    );
    const request = {
      method: 'POST',
      authViaCookie: true,
      cookies: { csrf_token: 'token-seguro' },
      headers: {
        origin: 'http://localhost:3001',
        'x-csrf-token': 'token-seguro',
      },
    };

    expect(guard.canActivate(context(request))).toBe(true);
  });

  it('rechaza una mutación por cookie sin CSRF', () => {
    const guard = new CsrfGuard(
      {
        getOrThrow: mock().mockReturnValue('http://localhost:3001'),
      } as unknown as ConfigService,
      {
        getAllAndOverride: mock().mockReturnValue(false),
      } as unknown as Reflector,
    );
    const request = {
      method: 'DELETE',
      authViaCookie: true,
      cookies: {},
      headers: { origin: 'http://localhost:3001' },
    };

    expect(() => guard.canActivate(context(request))).toThrow(
      ForbiddenException,
    );
  });

  it('no exige CSRF cuando se usa bearer', () => {
    const guard = new CsrfGuard(
      {} as ConfigService,
      {
        getAllAndOverride: mock().mockReturnValue(false),
      } as unknown as Reflector,
    );
    const request = {
      method: 'PATCH',
      authViaCookie: false,
      cookies: {},
      headers: {},
    };

    expect(guard.canActivate(context(request))).toBe(true);
  });
});
