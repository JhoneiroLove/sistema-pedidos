import { Prisma } from '../generated/prisma/client.js';

export const clientePublicSelect = {
  id: true,
  nombre: true,
  email: true,
  creadoEn: true,
  actualizadoEn: true,
} satisfies Prisma.ClienteSelect;
