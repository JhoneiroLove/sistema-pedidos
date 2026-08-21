import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash, verify } from 'argon2';

import { Prisma } from '../generated/prisma/client.js';
import { clientePublicSelect } from '../clientes/cliente.select.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegistroDto } from './dto/registro.dto.js';

// Hash válido sin usuario asociado para reducir diferencias de tiempo en el login.
const DUMMY_PASSWORD_HASH =
  '$argon2id$v=19$m=65536,p=4,t=3$sV7eb6hDW3UwnaAkuKWung$XLWkeQGlqhSFA8n+6BzpoMg31Ba5E0n8pLs6h+/0L+w';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async registrar(dto: RegistroDto) {
    const email = dto.email.trim().toLowerCase();
    const passwordHash = await hash(dto.password, { type: 2 });

    try {
      return await this.prisma.cliente.create({
        data: {
          nombre: dto.nombre.trim(),
          email,
          passwordHash,
        },
        select: clientePublicSelect,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('El email ya está registrado');
      }
      throw error;
    }
  }

  async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const cliente = await this.prisma.cliente.findUnique({
      where: { email: normalizedEmail },
      select: {
        ...clientePublicSelect,
        passwordHash: true,
      },
    });
    const validPassword = await verify(
      cliente?.passwordHash ?? DUMMY_PASSWORD_HASH,
      password,
    ).catch(() => false);

    if (!cliente || !validPassword) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: String(cliente.id),
      clienteId: cliente.id,
      email: cliente.email,
      nombre: cliente.nombre,
    });

    return {
      accessToken,
      cliente: {
        id: cliente.id,
        nombre: cliente.nombre,
        email: cliente.email,
        creadoEn: cliente.creadoEn,
        actualizadoEn: cliente.actualizadoEn,
      },
    };
  }
}
