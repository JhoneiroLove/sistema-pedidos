"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { apiRequest } from "@/shared/lib/api-client";
import type { FormState } from "@/shared/lib/form-state";
import { errorToFormState } from "@/shared/lib/form-state";

const articuloSchema = z.object({
  codigo: z.string().trim().min(1, "Ingresá un código").max(50),
  nombre: z.string().trim().min(1, "Ingresá un nombre").max(150),
  precioUnitario: z.coerce.number().min(0).multipleOf(0.01),
  stock: z.coerce.number().int().min(0),
});

export async function createArticuloAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = articuloSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }
  try {
    await apiRequest("/articulos", {
      method: "POST",
      body: JSON.stringify(parsed.data),
    });
    revalidatePath("/articulos");
    return { message: "Artículo creado correctamente." };
  } catch (error) {
    return errorToFormState(error);
  }
}

export async function deleteArticuloAction(id: number): Promise<void> {
  const articuloId = z.number().int().positive().parse(id);
  await apiRequest(`/articulos/${articuloId}`, { method: "DELETE" });
  revalidatePath("/articulos");
}
