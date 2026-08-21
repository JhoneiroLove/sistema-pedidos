import { ServiceUnavailableException } from '@nestjs/common';
import { jest } from '@jest/globals';

import { PrismaService } from '../prisma/prisma.service.js';
import { HealthService } from './health.service.js';

describe('HealthService', () => {
  const mock = () => jest.fn<(...args: any[]) => any>();

  it('informa que PostgreSQL está conectado', async () => {
    const prisma = { $queryRaw: mock().mockResolvedValue([{ '?column?': 1 }]) };
    const service = new HealthService(prisma as unknown as PrismaService);

    await expect(service.comprobar()).resolves.toMatchObject({
      status: 'ok',
      database: 'connected',
    });
  });

  it('devuelve 503 cuando PostgreSQL no responde', async () => {
    const prisma = {
      $queryRaw: mock().mockRejectedValue(new Error('offline')),
    };
    const service = new HealthService(prisma as unknown as PrismaService);

    await expect(service.comprobar()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
