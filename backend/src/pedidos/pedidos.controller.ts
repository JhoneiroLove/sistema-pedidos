import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { PedidosService } from './pedidos.service.js';

import { CreatePedidoDto } from './dto/create-pedido.dto.js';
import { UpdatePedidoDto } from './dto/update-pedido.dto.js';
import { CreateLineaPedidoDto } from './dto/create-linea-pedido.dto.js';

@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @Post()
  crear(@Body() dto: CreatePedidoDto) {
    return this.pedidosService.crear(dto);
  }

  @Get()
  obtenerTodos() {
    return this.pedidosService.obtenerTodos();
  }

  @Get(':id')
  obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return this.pedidosService.obtenerPorId(id);
  }

  @Patch(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePedidoDto,
  ) {
    return this.pedidosService.actualizar(id, dto);
  }

  @Delete(':id')
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.pedidosService.eliminar(id);
  }

  @Post(':id/lineas')
  agregarLinea(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateLineaPedidoDto,
  ) {
    return this.pedidosService.agregarLinea(id, dto);
  }

  @Delete(':id/lineas/:lineaId')
  eliminarLinea(
    @Param('id', ParseIntPipe) id: number,
    @Param('lineaId', ParseIntPipe) lineaId: number,
  ) {
    return this.pedidosService.eliminarLinea(id, lineaId);
  }

  @Patch(':id/confirmar')
  confirmar(@Param('id', ParseIntPipe) id: number) {
    return this.pedidosService.confirmar(id);
  }

  @Patch(':id/entregar')
  entregar(@Param('id', ParseIntPipe) id: number) {
    return this.pedidosService.entregar(id);
  }

  @Patch(':id/cancelar')
  cancelar(@Param('id', ParseIntPipe) id: number) {
    return this.pedidosService.cancelar(id);
  }
}
