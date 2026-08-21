import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Ingresá un email válido").max(254),
  password: z.string().min(8, "La contraseña es demasiado corta").max(200),
});

export const registerSchema = loginSchema.extend({
  nombre: z
    .string()
    .trim()
    .min(1, "Ingresá tu nombre")
    .max(150, "El nombre es demasiado largo"),
  password: z
    .string()
    .min(12, "Usá al menos 12 caracteres")
    .max(200, "La contraseña es demasiado larga"),
});
