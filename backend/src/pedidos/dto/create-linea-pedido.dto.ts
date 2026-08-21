import { IsInt, IsNumber, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLineaPedidoDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  articuloId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  cantidad!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  descuento: number = 0;
}
