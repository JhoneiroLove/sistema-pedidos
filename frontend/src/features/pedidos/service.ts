import "server-only";

import { apiRequest } from "@/shared/lib/api-client";
import type { Pedido } from "@/shared/types/domain";

export function getPedidos(): Promise<Pedido[]> {
  return apiRequest("/pedidos");
}

export function getPedido(id: number): Promise<Pedido> {
  return apiRequest(`/pedidos/${id}`);
}
