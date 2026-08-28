import { ConflictException, NotFoundException } from '@nestjs/common';
import { jest } from '@jest/globals';

import { EstadoPedido } from '../generated/prisma/client.js';
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
      pedido: {
        findMany: mock(),
        deleteMany: mock(),
      },
      $transaction: mock(),
    };
    prisma.$transaction = jest.fn(async (callback) => callback(prisma));
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

  it('rechaza eliminar si existe un pedido sin cancelar', async () => {
    const { prisma, service } = setup();
    prisma.cliente.findUnique.mockResolvedValue({ id: 1 });
    prisma.pedido.findMany.mockResolvedValue([{ estado: EstadoPedido.ENTREGADO }]);

    await expect(service.eliminar(1)).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('elimina pedidos cancelados antes de eliminar al cliente', async () => {
    const { prisma, service } = setup();
    prisma.cliente.findUnique.mockResolvedValue({ id: 1 });
    prisma.pedido.findMany.mockResolvedValue([
      { estado: EstadoPedido.CANCELADO },
      { estado: EstadoPedido.CANCELADO },
    ]);
    prisma.pedido.deleteMany.mockResolvedValue({ count: 2 });
    prisma.cliente.delete.mockResolvedValue({ id: 1, nombre: 'Acme' });

    await service.eliminar(1);

    expect(prisma.pedido.deleteMany).toHaveBeenCalledWith({
      where: { clienteId: 1, estado: EstadoPedido.CANCELADO },
    });
    expect(prisma.cliente.delete).toHaveBeenCalled();
  });
});
