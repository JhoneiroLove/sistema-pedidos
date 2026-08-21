import { z } from "zod";

export const lineSchema = z.object({
  articuloId: z.number().int().positive(),
  cantidad: z.number().int().positive(),
  descuento: z.number().min(0).max(100),
});

export const orderSchema = z.object({
  pedidoId: z.number().int().nonnegative(),
  clienteId: z.number().int().positive("Seleccioná un cliente"),
  fechaEntrega: z.string().date().optional(),
  detalles: z.array(lineSchema).min(1, "Agregá al menos una línea"),
});

export type OrderLineInput = z.infer<typeof lineSchema>;
