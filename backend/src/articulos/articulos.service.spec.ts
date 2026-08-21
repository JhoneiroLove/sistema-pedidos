import { ConflictException, NotFoundException } from '@nestjs/common';
import { jest } from '@jest/globals';

import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ArticulosService } from './articulos.service.js';

describe('ArticulosService', () => {
  const mock = () => jest.fn<(...args: any[]) => any>();

  function setup() {
    const prisma = {
      articulo: {
        create: mock(),
        findMany: mock(),
        findUnique: mock(),
        findFirst: mock(),
        update: mock(),
        delete: mock(),
      },
    };
    return {
      prisma,
      service: new ArticulosService(prisma as unknown as PrismaService),
    };
  }

  it('rechaza códigos existentes', async () => {
    const { prisma, service } = setup();
    prisma.articulo.findUnique.mockResolvedValue({ id: 1 });

    await expect(
      service.crear({
        codigo: 'ART-1',
        nombre: 'Artículo',
        precioUnitario: 10,
        stock: 5,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('normaliza código y nombre al crear', async () => {
    const { prisma, service } = setup();
    prisma.articulo.findUnique.mockResolvedValue(null);
    prisma.articulo.create.mockImplementation(({ data }) => data);

    await service.crear({
      codigo: ' ART-1 ',
      nombre: ' Artículo ',
      precioUnitario: 10,
      stock: 5,
    });

    expect(prisma.articulo.create).toHaveBeenCalledWith({
      data: {
        codigo: 'ART-1',
        nombre: 'Artículo',
        precioUnitario: 10,
        stock: 5,
      },
    });
  });

  it('informa cuando un artículo no existe', async () => {
    const { prisma, service } = setup();
    prisma.articulo.findUnique.mockResolvedValue(null);

    await expect(service.obtenerPorId(99)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('mapea la restricción de líneas como conflicto al eliminar', async () => {
    const { prisma, service } = setup();
    prisma.articulo.findUnique.mockResolvedValue({ id: 1 });
    prisma.articulo.delete.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('foreign key', {
        code: 'P2003',
        clientVersion: '7.9.1',
      }),
    );

    await expect(service.eliminar(1)).rejects.toBeInstanceOf(ConflictException);
  });
});
