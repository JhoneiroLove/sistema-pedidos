"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { apiRequest } from "@/shared/lib/api-client";
import type { FormState } from "@/shared/lib/form-state";
import { errorToFormState } from "@/shared/lib/form-state";
import type { Pedido } from "@/shared/types/domain";
import { orderSchema } from "./schemas";

function parseLines(value: FormDataEntryValue | null): unknown {
  if (typeof value !== "string" || value.length > 100_000) return [];
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return [];
  }
}

export async function saveOrderAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const delivery = String(formData.get("fechaEntrega") ?? "");
  const parsed = orderSchema.safeParse({
    pedidoId: Number(formData.get("pedidoId") ?? 0),
    clienteId: Number(formData.get("clienteId")),
    fechaEntrega: delivery || undefined,
    detalles: parseLines(formData.get("detalles")),
  });
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  let pedido: Pedido;
  try {
    const { pedidoId, ...payload } = parsed.data;
    pedido = await apiRequest<Pedido>(
      pedidoId ? `/pedidos/${pedidoId}` : "/pedidos",
      {
        method: pedidoId ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      },
    );
    revalidatePath("/pedidos");
  } catch (error) {
    return errorToFormState(error);
  }

  redirect(`/pedidos/${pedido.id}`);
}

const transitionSchema = z.object({
  id: z.number().int().positive(),
  transition: z.enum(["confirmar", "entregar", "cancelar"]),
});

export async function transitionOrderAction(
  id: number,
  transition: "confirmar" | "entregar" | "cancelar",
): Promise<void> {
  const parsed = transitionSchema.parse({ id, transition });
  await apiRequest(`/pedidos/${parsed.id}/${parsed.transition}`, {
    method: "PATCH",
  });
  revalidatePath("/pedidos");
  revalidatePath(`/pedidos/${parsed.id}`);
}

export async function deleteOrderAction(id: number): Promise<void> {
  const orderId = z.number().int().positive().parse(id);
  await apiRequest(`/pedidos/${orderId}`, { method: "DELETE" });
  revalidatePath("/pedidos");
  redirect("/pedidos");
}
