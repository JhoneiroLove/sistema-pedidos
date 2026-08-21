import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { jest } from '@jest/globals';
import { JwtService } from '@nestjs/jwt';
import { hash, verify } from 'argon2';

import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  const mock = () => jest.fn<(...args: any[]) => any>();
  const clientePublico = {
    id: 7,
    nombre: 'Ada Lovelace',
    email: 'ada@example.com',
    creadoEn: new Date(),
    actualizadoEn: new Date(),
  };

  function setup() {
    const prisma = {
      cliente: { create: mock(), findUnique: mock() },
    };
    const jwt = { signAsync: mock() };
    return {
      prisma,
      jwt,
      service: new AuthService(
        prisma as unknown as PrismaService,
        jwt as unknown as JwtService,
      ),
    };
  }

  it('registra un cliente con email normalizado y contraseña Argon2', async () => {
    const { prisma, service } = setup();
    prisma.cliente.create.mockImplementation(({ data }) => ({
      ...clientePublico,
      email: data.email,
    }));

    await service.registrar({
      nombre: ' Ada Lovelace ',
      email: ' ADA@Example.COM ',
      password: 'Clave-Segura-123',
    });

    const data = prisma.cliente.create.mock.calls[0][0].data;
    expect(data.email).toBe('ada@example.com');
    expect(data.nombre).toBe('Ada Lovelace');
    expect(data.passwordHash).not.toBe('Clave-Segura-123');
    await expect(
      verify(data.passwordHash as string, 'Clave-Segura-123'),
    ).resolves.toBe(true);
  });

  it('rechaza un email ya registrado', async () => {
    const { prisma, service } = setup();
    prisma.cliente.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', {
        code: 'P2002',
        clientVersion: '7.9.1',
      }),
    );

    await expect(
      service.registrar({
        nombre: 'Ada',
        email: 'ada@example.com',
        password: 'Clave-Segura-123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('loguea un cliente válido sin devolver su hash', async () => {
    const { prisma, jwt, service } = setup();
    const passwordHash = await hash('Clave-Segura-123');
    prisma.cliente.findUnique.mockResolvedValue({
      ...clientePublico,
      passwordHash,
    });
    jwt.signAsync.mockResolvedValue('jwt-firmado');

    const result = await service.login('ADA@example.com', 'Clave-Segura-123');

    expect(result.accessToken).toBe('jwt-firmado');
    expect(result.cliente).toEqual(clientePublico);
    expect(result.cliente).not.toHaveProperty('passwordHash');
    expect(jwt.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({ sub: '7', clienteId: 7 }),
    );
  });

  it('usa un mensaje genérico ante credenciales inválidas', async () => {
    const { prisma, service } = setup();
    prisma.cliente.findUnique.mockResolvedValue(null);

    await expect(
      service.login('nadie@example.com', 'Clave-Incorrecta-123'),
    ).rejects.toEqual(new UnauthorizedException('Credenciales inválidas'));
  });
});
