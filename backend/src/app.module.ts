import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './prisma/prisma.module.js';
import { ClientesModule } from './clientes/clientes.module.js';
import { ArticulosModule } from './articulos/articulos.module.js';
import { PedidosModule } from './pedidos/pedidos.module.js';
import { AuthModule } from './auth/auth.module.js';
import { validateEnvironment } from './config/env.validation.js';
import { ThrottlerModule } from '@nestjs/throttler';
import { HealthModule } from './health/health.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    AuthModule,
    PrismaModule,
    ClientesModule,
    ArticulosModule,
    PedidosModule,
    HealthModule,
  ],
})
export class AppModule {}
