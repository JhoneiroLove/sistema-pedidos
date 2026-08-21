import type { Request } from 'express';

export interface JwtPayload {
  sub: string;
  clienteId: number;
  email: string;
  nombre: string;
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
  authViaCookie: boolean;
}
