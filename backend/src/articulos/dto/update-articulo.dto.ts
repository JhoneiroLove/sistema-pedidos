import { PartialType } from '@nestjs/mapped-types';

import { CreateArticuloDto } from './create-articulo.dto.js';

export class UpdateArticuloDto extends PartialType(CreateArticuloDto) {}
