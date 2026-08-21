import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const connectionString = process.env.DATABASE_URL;
    const schemaName = process.env.DATABASE_SCHEMA ?? 'public';

    if (!connectionString) {
      throw new Error('DATABASE_URL no está definida');
    }

    const adapter = new PrismaPg(
      {
        connectionString,
      },
      {
        schema: schemaName,
      },
    );

    super({
      adapter,
    });
  }

  async onModuleInit(): Promise<void> {
    const schemaName = process.env.DATABASE_SCHEMA ?? 'public';

    try {
      await this.$connect();
      const [schema] = await this.$queryRaw<Array<{ clientes: string | null }>>`
        SELECT to_regclass(${`${schemaName}.clientes`})::text AS "clientes"
      `;

      if (!schema?.clientes) {
        throw new Error(
          'La base existe pero no está migrada. Ejecutá: npm run db:migrate',
        );
      }
    } catch (error) {
      await this.$disconnect().catch(() => undefined);
      const detail =
        error instanceof Error ? error.message : 'error desconocido';
      throw new Error(
        `No se pudo inicializar PostgreSQL usando DATABASE_URL: ${detail}`,
        { cause: error },
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
