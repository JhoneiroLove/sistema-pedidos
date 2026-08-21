import "server-only";

import { apiRequest } from "@/shared/lib/api-client";
import type { Articulo } from "@/shared/types/domain";

export function getArticulos(): Promise<Articulo[]> {
  return apiRequest("/articulos");
}
