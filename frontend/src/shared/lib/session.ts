import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { ApiError, apiRequest } from "./api-client";
import type { SessionUser } from "../types/domain";

export const getSession = cache(async (): Promise<SessionUser | null> => {
  try {
    return await apiRequest<SessionUser>("/auth/me");
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
});

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
