import { ConflictException, NotFoundException } from '@nestjs/common';
import { jest } from '@jest/globals';

import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ClientesService } from './clientes.service.js';

describe('ClientesService', () => {
  const mock = () => jest.fn<(...args: any[]) => any>();

  function setup() {
    const prisma = {
      cliente: {
        create: mock(),
        findMany: mock(),
        findUnique: mock(),
        update: mock(),
        delete: mock(),
      },
    };
    return {
      prisma,
      service: new ClientesService(prisma as unknown as PrismaService),
    };
  }

  it('normaliza el nombre y nunca selecciona passwordHash', async () => {
    const { prisma, service } = setup();
    prisma.cliente.create.mockResolvedValue({ id: 1, nombre: 'Acme' });

    await service.crear({ nombre: '  Acme  ' });

    const query = prisma.cliente.create.mock.calls[0][0];
    expect(query.data.nombre).toBe('Acme');
    expect(query.select.passwordHash).toBeUndefined();
  });

  it('informa cuando el cliente no existe', async () => {
    const { prisma, service } = setup();
    prisma.cliente.findUnique.mockResolvedValue(null);

    await expect(service.obtenerPorId(99)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('mapea la relación de pedidos como conflicto al eliminar', async () => {
    const { prisma, service } = setup();
    prisma.cliente.findUnique.mockResolvedValue({ id: 1 });
    prisma.cliente.delete.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('foreign key', {
        code: 'P2003',
        clientVersion: '7.9.1',
      }),
    );

    await expect(service.eliminar(1)).rejects.toBeInstanceOf(ConflictException);
  });
});
