import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';
import { CreateArticuloDto } from './dto/create-articulo.dto.js';
import { UpdateArticuloDto } from './dto/update-articulo.dto.js';

@Injectable()
export class ArticulosService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(dto: CreateArticuloDto) {
    const codigo = dto.codigo.trim();

    const existente = await this.prisma.articulo.findUnique({
      where: { codigo },
    });

    if (existente) {
      throw new ConflictException(
        `Ya existe un artículo con el código ${codigo}`,
      );
    }

    try {
      return await this.prisma.articulo.create({
        data: {
          codigo,
          nombre: dto.nombre.trim(),
          precioUnitario: dto.precioUnitario,
          stock: dto.stock,
        },
      });
    } catch (error) {
      this.mapearConflictoCodigo(error, codigo);
    }
  }

  async obtenerTodos() {
    return this.prisma.articulo.findMany({
      orderBy: {
        nombre: 'asc',
      },
    });
  }

  async obtenerPorId(id: number) {
    const articulo = await this.prisma.articulo.findUnique({
      where: { id },
    });

    if (!articulo) {
      throw new NotFoundException(`No existe el artículo con ID ${id}`);
    }

    return articulo;
  }

  async actualizar(id: number, dto: UpdateArticuloDto) {
    await this.verificarExistencia(id);

    if (dto.codigo !== undefined) {
      const codigo = dto.codigo.trim();

      const existente = await this.prisma.articulo.findFirst({
        where: {
          codigo,
          NOT: {
            id,
          },
        },
      });

      if (existente) {
        throw new ConflictException(
          `Ya existe otro artículo con el código ${codigo}`,
        );
      }
    }

    try {
      return await this.prisma.articulo.update({
        where: { id },
        data: {
          ...(dto.codigo !== undefined && {
            codigo: dto.codigo.trim(),
          }),

          ...(dto.nombre !== undefined && {
            nombre: dto.nombre.trim(),
          }),

          ...(dto.precioUnitario !== undefined && {
            precioUnitario: dto.precioUnitario,
          }),

          ...(dto.stock !== undefined && {
            stock: dto.stock,
          }),
        },
      });
    } catch (error) {
      this.mapearConflictoCodigo(error, dto.codigo?.trim() ?? 'indicado');
    }
  }

  async eliminar(id: number) {
    await this.verificarExistencia(id);

    try {
      return await this.prisma.articulo.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new ConflictException(
          'No se puede eliminar el artículo porque está relacionado con pedidos.',
        );
      }
      throw error;
    }
  }

  private async verificarExistencia(id: number) {
    const articulo = await this.prisma.articulo.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!articulo) {
      throw new NotFoundException(`No existe el artículo con ID ${id}`);
    }
  }

  private mapearConflictoCodigo(error: unknown, codigo: string): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        `Ya existe un artículo con el código ${codigo}`,
      );
    }
    throw error;
  }
}
