import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { EstadoPedido, Prisma } from '../generated/prisma/client.js';

import { PrismaService } from '../prisma/prisma.service.js';
import { clientePublicSelect } from '../clientes/cliente.select.js';

import { CreatePedidoDto } from './dto/create-pedido.dto.js';
import { UpdatePedidoDto } from './dto/update-pedido.dto.js';
import { CreateLineaPedidoDto } from './dto/create-linea-pedido.dto.js';

@Injectable()
export class PedidosService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================================================
  // CREAR PEDIDO
  // =========================================================

  async crear(dto: CreatePedidoDto) {
    await this.verificarCliente(dto.clienteId);
    this.validarFechaEntrega(dto.fechaEntrega);

    const detalles = dto.detalles ?? [];

    const lineas = await this.construirLineas(detalles);

    const numeroPedido = this.generarNumeroPedido();

    return this.prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.create({
        data: {
          numeroPedido,
          clienteId: dto.clienteId,

          fechaEntrega: dto.fechaEntrega
            ? new Date(dto.fechaEntrega)
            : undefined,

          estado: EstadoPedido.BORRADOR,

          lineas: {
            create: lineas,
          },
        },

        include: this.incluirDetallePedido(),
      });

      return pedido;
    });
  }

  // =========================================================
  // LISTAR PEDIDOS
  // =========================================================

  async obtenerTodos() {
    return this.prisma.pedido.findMany({
      include: this.incluirDetallePedido(),
      orderBy: {
        creadoEn: 'desc',
      },
    });
  }

  // =========================================================
  // OBTENER PEDIDO POR ID
  // =========================================================

  async obtenerPorId(id: number) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id },
      include: this.incluirDetallePedido(),
    });

    if (!pedido) {
      throw new NotFoundException(`No existe el pedido con ID ${id}`);
    }

    return pedido;
  }

  // =========================================================
  // ACTUALIZAR PEDIDO
  // =========================================================

  async actualizar(id: number, dto: UpdatePedidoDto) {
    const pedido = await this.obtenerPedidoBasico(id);

    this.validarEdicion(pedido.estado);
    this.validarFechaEntrega(dto.fechaEntrega, pedido.fechaPedido);

    if (dto.clienteId !== undefined) {
      await this.verificarCliente(dto.clienteId);
    }

    const lineas =
      dto.detalles !== undefined
        ? await this.construirLineas(dto.detalles)
        : undefined;

    return this.prisma.$transaction(async (tx) => {
      const actualizado = await tx.pedido.update({
        where: { id },

        data: {
          ...(dto.clienteId !== undefined && {
            clienteId: dto.clienteId,
          }),

          ...(dto.fechaEntrega !== undefined && {
            fechaEntrega: new Date(dto.fechaEntrega),
          }),

          ...(lineas !== undefined && {
            lineas: {
              deleteMany: {},

              create: lineas,
            },
          }),
        },

        include: this.incluirDetallePedido(),
      });

      return actualizado;
    });
  }

  // =========================================================
  // ELIMINAR PEDIDO
  // =========================================================

  async eliminar(id: number) {
    const pedido = await this.obtenerPedidoBasico(id);

    if (pedido.estado !== EstadoPedido.BORRADOR) {
      throw new ConflictException(
        'Solo se pueden eliminar pedidos en estado BORRADOR.',
      );
    }

    await this.prisma.pedido.delete({
      where: { id },
    });

    return {
      mensaje: 'Pedido eliminado correctamente',
    };
  }

  async agregarLinea(id: number, dto: CreateLineaPedidoDto) {
    const pedido = await this.obtenerPedidoBasico(id);
    this.validarEdicion(pedido.estado);

    const existente = await this.prisma.lineaPedido.findUnique({
      where: {
        pedidoId_articuloId: { pedidoId: id, articuloId: dto.articuloId },
      },
      select: { id: true },
    });
    if (existente) {
      throw new ConflictException('El artículo ya pertenece al pedido.');
    }

    const [linea] = await this.construirLineas([dto]);
    await this.prisma.lineaPedido.create({
      data: { pedidoId: id, ...linea },
    });

    return this.obtenerPorId(id);
  }

  async eliminarLinea(id: number, lineaId: number) {
    const pedido = await this.obtenerPedidoBasico(id);
    this.validarEdicion(pedido.estado);

    const resultado = await this.prisma.lineaPedido.deleteMany({
      where: { id: lineaId, pedidoId: id },
    });
    if (resultado.count === 0) {
      throw new NotFoundException(
        `No existe la línea ${lineaId} en el pedido ${id}.`,
      );
    }

    return this.obtenerPorId(id);
  }

  // =========================================================
  // CONFIRMAR PEDIDO
  // =========================================================

  async confirmar(id: number) {
    const pedido = await this.obtenerPedidoConLineas(id);

    if (pedido.estado !== EstadoPedido.BORRADOR) {
      throw new ConflictException(
        'Solo se pueden confirmar pedidos en estado BORRADOR.',
      );
    }

    if (pedido.lineas.length === 0) {
      throw new BadRequestException('El pedido debe tener al menos una línea.');
    }

    return this.prisma.$transaction(async (tx) => {
      const transicion = await tx.pedido.updateMany({
        where: { id, estado: EstadoPedido.BORRADOR },
        data: { estado: EstadoPedido.CONFIRMADO },
      });
      if (transicion.count === 0) {
        throw new ConflictException('El pedido ya no está en estado BORRADOR.');
      }

      for (const linea of pedido.lineas) {
        const resultado = await tx.articulo.updateMany({
          where: {
            id: linea.articuloId,
            stock: {
              gte: linea.cantidad,
            },
          },

          data: {
            stock: {
              decrement: linea.cantidad,
            },
          },
        });

        if (resultado.count === 0) {
          throw new ConflictException(
            `Stock insuficiente para el artículo "${linea.articulo.nombre}".`,
          );
        }
      }

      return tx.pedido.findUniqueOrThrow({
        where: { id },
        include: this.incluirDetallePedido(),
      });
    });
  }

  // =========================================================
  // ENTREGAR PEDIDO
  // =========================================================

  async entregar(id: number) {
    const pedido = await this.obtenerPedidoBasico(id);

    if (pedido.estado !== EstadoPedido.CONFIRMADO) {
      throw new ConflictException(
        'Solo se pueden entregar pedidos CONFIRMADOS.',
      );
    }

    const resultado = await this.prisma.pedido.updateMany({
      where: { id, estado: EstadoPedido.CONFIRMADO },
      data: { estado: EstadoPedido.ENTREGADO },
    });
    if (resultado.count === 0) {
      throw new ConflictException('El pedido ya no está CONFIRMADO.');
    }

    return this.obtenerPorId(id);
  }

  // =========================================================
  // CANCELAR PEDIDO
  // =========================================================

  async cancelar(id: number) {
    const pedido = await this.obtenerPedidoConLineas(id);

    if (
      pedido.estado !== EstadoPedido.BORRADOR &&
      pedido.estado !== EstadoPedido.CONFIRMADO
    ) {
      throw new ConflictException(
        'El pedido no puede ser cancelado en su estado actual.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const transicion = await tx.pedido.updateMany({
        where: { id, estado: pedido.estado },
        data: { estado: EstadoPedido.CANCELADO },
      });
      if (transicion.count === 0) {
        throw new ConflictException(
          'El pedido cambió de estado durante la operación.',
        );
      }

      if (pedido.estado === EstadoPedido.CONFIRMADO) {
        for (const linea of pedido.lineas) {
          await tx.articulo.update({
            where: {
              id: linea.articuloId,
            },

            data: {
              stock: {
                increment: linea.cantidad,
              },
            },
          });
        }
      }

      return tx.pedido.findUniqueOrThrow({
        where: { id },
        include: this.incluirDetallePedido(),
      });
    });
  }

  // =========================================================
  // CONSTRUIR LÍNEAS
  // =========================================================

  private async construirLineas(detalles: CreateLineaPedidoDto[]) {
    if (detalles.length === 0) {
      return [];
    }

    const articuloIds = detalles.map((detalle) => detalle.articuloId);

    const idsUnicos = new Set(articuloIds);

    if (idsUnicos.size !== articuloIds.length) {
      throw new BadRequestException(
        'No puedes repetir el mismo artículo dentro de un pedido.',
      );
    }

    const articulos = await this.prisma.articulo.findMany({
      where: {
        id: {
          in: articuloIds,
        },
      },
    });

    if (articulos.length !== articuloIds.length) {
      throw new BadRequestException('Uno o más artículos no existen.');
    }

    const mapaArticulos = new Map(
      articulos.map((articulo) => [articulo.id, articulo]),
    );

    return detalles.map((detalle) => {
      const articulo = mapaArticulos.get(detalle.articuloId);

      if (!articulo) {
        throw new BadRequestException(
          `No existe el artículo ${detalle.articuloId}.`,
        );
      }

      const precio = new Prisma.Decimal(articulo.precioUnitario.toString());

      const cantidad = new Prisma.Decimal(detalle.cantidad);

      const descuento = new Prisma.Decimal(detalle.descuento ?? 0);

      const importeBruto = precio.mul(cantidad);

      const importeDescuento = importeBruto.mul(descuento).div(100);

      const importe = importeBruto.sub(importeDescuento);

      return {
        articuloId: articulo.id,
        cantidad: detalle.cantidad,
        precioUnitario: precio,
        descuento,
        importe,
      };
    });
  }

  // =========================================================
  // VALIDAR CLIENTE
  // =========================================================

  private async verificarCliente(clienteId: number) {
    const cliente = await this.prisma.cliente.findUnique({
      where: {
        id: clienteId,
      },
    });

    if (!cliente) {
      throw new NotFoundException(`No existe el cliente con ID ${clienteId}.`);
    }

    return cliente;
  }

  // =========================================================
  // OBTENER PEDIDO BÁSICO
  // =========================================================

  private async obtenerPedidoBasico(id: number) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id },
    });

    if (!pedido) {
      throw new NotFoundException(`No existe el pedido con ID ${id}.`);
    }

    return pedido;
  }

  // =========================================================
  // OBTENER PEDIDO CON LÍNEAS
  // =========================================================

  private async obtenerPedidoConLineas(id: number) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id },

      include: {
        cliente: { select: clientePublicSelect },

        lineas: {
          include: {
            articulo: true,
          },
        },
      },
    });

    if (!pedido) {
      throw new NotFoundException(`No existe el pedido con ID ${id}.`);
    }

    return pedido;
  }

  // =========================================================
  // VALIDAR EDICIÓN
  // =========================================================

  private validarEdicion(estado: EstadoPedido) {
    if (estado !== EstadoPedido.BORRADOR) {
      throw new ConflictException(
        'Solo se pueden modificar pedidos en estado BORRADOR.',
      );
    }
  }

  private validarFechaEntrega(
    fechaEntrega?: string,
    fechaPedido: Date = new Date(),
  ): void {
    if (!fechaEntrega) return;

    const entrega = new Date(fechaEntrega);
    const pedido = new Date(fechaPedido);
    entrega.setUTCHours(0, 0, 0, 0);
    pedido.setUTCHours(0, 0, 0, 0);

    if (entrega < pedido) {
      throw new BadRequestException(
        'La fecha de entrega no puede ser anterior a la fecha del pedido.',
      );
    }
  }

  // =========================================================
  // GENERAR NÚMERO DE PEDIDO
  // =========================================================

  private generarNumeroPedido(): string {
    const ahora = new Date();

    const fecha = ahora.toISOString().replace(/\D/g, '').slice(0, 17);

    const sufijo = Math.random().toString(36).substring(2, 8).toUpperCase();

    return `PED-${fecha}-${sufijo}`;
  }

  // =========================================================
  // INCLUDE ESTÁNDAR
  // =========================================================

  private incluirDetallePedido() {
    return {
      cliente: { select: clientePublicSelect },

      lineas: {
        include: {
          articulo: true,
        },
      },
    };
  }
}
