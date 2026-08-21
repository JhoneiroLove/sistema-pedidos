import { BadRequestException, ConflictException } from '@nestjs/common';
import { jest } from '@jest/globals';
import { Prisma } from '../generated/prisma/client.js';

import { PrismaService } from '../prisma/prisma.service.js';
import { PedidosService } from './pedidos.service.js';

describe('PedidosService', () => {
  const mock = () => jest.fn<(...args: any[]) => any>();
  const cliente = { id: 1, nombre: 'Cliente de prueba' };
  const articulo = {
    id: 10,
    codigo: 'ART-10',
    nombre: 'Artículo de prueba',
    precioUnitario: new Prisma.Decimal(100),
    stock: 20,
  };

  function createPrismaMock() {
    const tx = {
      pedido: {
        create: mock(),
        updateMany: mock(),
        findUniqueOrThrow: mock(),
      },
      articulo: { updateMany: mock(), update: mock() },
    };
    const prisma = {
      cliente: { findUnique: mock() },
      articulo: { findMany: mock() },
      pedido: { findUnique: mock() },
      $transaction: mock().mockImplementation(
        (callback: (client: typeof tx) => unknown) => callback(tx),
      ),
    };

    return { prisma, tx };
  }

  it('calcula el importe en el servidor aplicando el descuento', async () => {
    const { prisma, tx } = createPrismaMock();
    prisma.cliente.findUnique.mockResolvedValue(cliente);
    prisma.articulo.findMany.mockResolvedValue([articulo]);
    tx.pedido.create.mockImplementation(({ data }) => data);
    const service = new PedidosService(prisma as unknown as PrismaService);

    await service.crear({
      clienteId: 1,
      detalles: [{ articuloId: 10, cantidad: 2, descuento: 10 }],
    });

    const data = tx.pedido.create.mock.calls[0][0].data;
    expect(data.lineas.create[0].precioUnitario.toString()).toBe('100');
    expect(data.lineas.create[0].importe.toString()).toBe('180');
  });

  it('rechaza artículos repetidos antes de persistir el pedido', async () => {
    const { prisma, tx } = createPrismaMock();
    prisma.cliente.findUnique.mockResolvedValue(cliente);
    const service = new PedidosService(prisma as unknown as PrismaService);

    await expect(
      service.crear({
        clienteId: 1,
        detalles: [
          { articuloId: 10, cantidad: 1, descuento: 0 },
          { articuloId: 10, cantidad: 2, descuento: 0 },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.pedido.create).not.toHaveBeenCalled();
  });

  it('rechaza una fecha de entrega anterior al pedido', async () => {
    const { prisma } = createPrismaMock();
    prisma.cliente.findUnique.mockResolvedValue(cliente);
    const service = new PedidosService(prisma as unknown as PrismaService);

    await expect(
      service.crear({ clienteId: 1, fechaEntrega: '2000-01-01' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('reclama atómicamente el estado antes de descontar stock', async () => {
    const { prisma, tx } = createPrismaMock();
    const pedido = {
      id: 5,
      estado: 'BORRADOR',
      lineas: [{ articuloId: 10, cantidad: 2, articulo }],
    };
    prisma.pedido.findUnique.mockResolvedValue(pedido);
    tx.pedido.updateMany.mockResolvedValue({ count: 1 });
    tx.articulo.updateMany.mockResolvedValue({ count: 1 });
    tx.pedido.findUniqueOrThrow.mockResolvedValue({
      ...pedido,
      estado: 'CONFIRMADO',
    });
    const service = new PedidosService(prisma as unknown as PrismaService);

    await service.confirmar(5);

    expect(tx.pedido.updateMany).toHaveBeenCalledWith({
      where: { id: 5, estado: 'BORRADOR' },
      data: { estado: 'CONFIRMADO' },
    });
    expect(tx.pedido.updateMany.mock.invocationCallOrder[0]).toBeLessThan(
      tx.articulo.updateMany.mock.invocationCallOrder[0],
    );
  });

  it('no descuenta stock si otra solicitud ya confirmó el pedido', async () => {
    const { prisma, tx } = createPrismaMock();
    prisma.pedido.findUnique.mockResolvedValue({
      id: 5,
      estado: 'BORRADOR',
      lineas: [{ articuloId: 10, cantidad: 2, articulo }],
    });
    tx.pedido.updateMany.mockResolvedValue({ count: 0 });
    const service = new PedidosService(prisma as unknown as PrismaService);

    await expect(service.confirmar(5)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(tx.articulo.updateMany).not.toHaveBeenCalled();
  });
});
