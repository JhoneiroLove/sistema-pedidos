import {
  IsInt,
  IsNumber,
  IsString,
  MaxLength,
  Matches,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateArticuloDto {
  @IsString()
  @Matches(/\S/, { message: 'El código no puede estar vacío' })
  @MaxLength(50)
  codigo!: string;

  @IsString()
  @Matches(/\S/, { message: 'El nombre no puede estar vacío' })
  @MaxLength(150)
  nombre!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precioUnitario!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock!: number;
}
