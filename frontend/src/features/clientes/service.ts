import "server-only";

import { apiRequest } from "@/shared/lib/api-client";
import type { Cliente } from "@/shared/types/domain";

export function getClientes(): Promise<Cliente[]> {
  return apiRequest("/clientes");
}
