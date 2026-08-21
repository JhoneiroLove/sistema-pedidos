import "server-only";

import { cookies } from "next/headers";
import { ApiError } from "./api-error";

export { ApiError } from "./api-error";

export const SESSION_COOKIE = "pedidos_session";

function getApiUrl(): string {
  const value = process.env.API_URL;
  if (!value) throw new Error("API_URL no está definida");

  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error("API_URL debe usar HTTP o HTTPS");
  }
  return value.replace(/\/$/, "");
}

async function parseError(response: Response): Promise<string> {
  const fallback = `La API respondió con estado ${response.status}`;
  try {
    const body = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(body.message)) return body.message.join(". ");
    return body.message ?? fallback;
  } catch {
    return fallback;
  }
}

export async function apiRequest<T>(
  path: `/${string}`,
  init: RequestInit = {},
  authenticated = true,
): Promise<T> {
  if (path.includes("//") || path.includes("..")) {
    throw new Error("Ruta de API inválida");
  }

  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body) headers.set("Content-Type", "application/json");

  if (authenticated) {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    if (!token) throw new ApiError(401, "Sesión requerida");
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${getApiUrl()}${path}`, {
      ...init,
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
  } catch {
    throw new ApiError(503, "No se pudo conectar con la API");
  }

  if (!response.ok) throw new ApiError(response.status, await parseError(response));
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
