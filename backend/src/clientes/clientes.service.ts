import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { EstadoPedido } from '../generated/prisma/client.js';
import { CreateClienteDto } from './dto/create-cliente.dto.js';
import { UpdateClienteDto } from './dto/update-cliente.dto.js';
import { clientePublicSelect } from './cliente.select.js';

@Injectable()
export class ClientesService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(dto: CreateClienteDto) {
    return this.prisma.cliente.create({
      data: {
        nombre: dto.nombre.trim(),
      },
      select: clientePublicSelect,
    });
  }

  async obtenerTodos() {
    return this.prisma.cliente.findMany({
      select: clientePublicSelect,
      orderBy: {
        nombre: 'asc',
      },
    });
  }

  async obtenerPorId(id: number) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id },
      select: {
        ...clientePublicSelect,
        pedidos: true,
      },
    });

    if (!cliente) {
      throw new NotFoundException(`No existe el cliente con ID ${id}`);
    }

    return cliente;
  }

  async actualizar(id: number, dto: UpdateClienteDto) {
    await this.verificarExistencia(id);

    return this.prisma.cliente.update({
      where: { id },
      data: {
        ...(dto.nombre !== undefined && {
          nombre: dto.nombre.trim(),
        }),
      },
      select: clientePublicSelect,
    });
  }

  async eliminar(id: number) {
    await this.verificarExistencia(id);

    const pedidoPendiente = await this.prisma.pedido.findFirst({
      where: {
        clienteId: id,
        estado: { in: [EstadoPedido.BORRADOR, EstadoPedido.CONFIRMADO] },
      },
      select: { id: true },
    });
    if (pedidoPendiente) {
      throw new ConflictException(
        'No se puede eliminar el cliente porque tiene pedidos pendientes de entrega.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.pedido.deleteMany({
        where: { clienteId: id },
      });
      return tx.cliente.delete({
        where: { id },
        select: clientePublicSelect,
      });
    });
  }

  private async verificarExistencia(id: number) {
    const existe = await this.prisma.cliente.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existe) {
      throw new NotFoundException(`No existe el cliente con ID ${id}`);
    }
  }
}
