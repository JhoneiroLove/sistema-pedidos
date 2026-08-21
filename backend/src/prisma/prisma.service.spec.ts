import { jest } from '@jest/globals';

import { PrismaService } from './prisma.service.js';

describe('PrismaService', () => {
  const mock = () => jest.fn<(...args: any[]) => any>();

  it('ejecuta una consulta real de salud al inicializar', async () => {
    const fake = {
      $connect: mock().mockResolvedValue(undefined),
      $queryRaw: mock().mockResolvedValue([{ clientes: 'clientes' }]),
      $disconnect: mock(),
    };

    await PrismaService.prototype.onModuleInit.call(fake);

    expect(fake.$connect).toHaveBeenCalledTimes(1);
    expect(fake.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('falla al arrancar si la base todavía no fue migrada', async () => {
    const fake = {
      $connect: mock().mockResolvedValue(undefined),
      $queryRaw: mock().mockResolvedValue([{ clientes: null }]),
      $disconnect: mock().mockResolvedValue(undefined),
    };

    await expect(
      PrismaService.prototype.onModuleInit.call(fake),
    ).rejects.toThrow('La base existe pero no está migrada');
    expect(fake.$disconnect).toHaveBeenCalledTimes(1);
  });

  it('falla al arrancar si DATABASE_URL no responde', async () => {
    const fake = {
      $connect: mock().mockResolvedValue(undefined),
      $queryRaw: mock().mockRejectedValue(new Error('ECONNREFUSED')),
      $disconnect: mock().mockResolvedValue(undefined),
    };

    await expect(
      PrismaService.prototype.onModuleInit.call(fake),
    ).rejects.toThrow('ECONNREFUSED');
  });
});
