import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

import { CreateLineaPedidoDto } from './create-linea-pedido.dto.js';

export class CreatePedidoDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  clienteId!: number;

  @IsOptional()
  @IsDateString()
  fechaEntrega?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLineaPedidoDto)
  detalles?: CreateLineaPedidoDto[];
}
