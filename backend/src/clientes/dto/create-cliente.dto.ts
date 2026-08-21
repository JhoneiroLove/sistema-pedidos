import { IsString, Matches, MaxLength } from 'class-validator';

export class CreateClienteDto {
  @IsString()
  @Matches(/\S/, { message: 'El nombre no puede estar vacío' })
  @MaxLength(150)
  nombre!: string;
}
