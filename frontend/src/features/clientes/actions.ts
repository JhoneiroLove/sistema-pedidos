"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { apiRequest } from "@/shared/lib/api-client";
import type { FormState } from "@/shared/lib/form-state";
import { errorToFormState } from "@/shared/lib/form-state";

const clienteSchema = z.object({
  nombre: z.string().trim().min(1, "Ingresá un nombre").max(150),
});

export async function createClienteAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = clienteSchema.safeParse({ nombre: formData.get("nombre") });
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }
  try {
    await apiRequest("/clientes", {
      method: "POST",
      body: JSON.stringify(parsed.data),
    });
    revalidatePath("/clientes");
    return { message: "Cliente creado correctamente." };
  } catch (error) {
    return errorToFormState(error);
  }
}

export async function deleteClienteAction(id: number): Promise<FormState> {
  try {
    const clienteId = z.number().int().positive().parse(id);
    await apiRequest(`/clientes/${clienteId}`, { method: "DELETE" });
    revalidatePath("/clientes");
    return {};
  } catch (error) {
    return errorToFormState(error);
  }
}
