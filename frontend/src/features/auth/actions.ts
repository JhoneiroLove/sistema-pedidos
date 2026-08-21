"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { ApiError, apiRequest, SESSION_COOKIE } from "@/shared/lib/api-client";
import type { FormState } from "@/shared/lib/form-state";
import { errorToFormState } from "@/shared/lib/form-state";
import type { Cliente } from "@/shared/types/domain";
import { loginSchema, registerSchema } from "./schemas";

interface LoginResponse {
  accessToken: string;
  cliente: Cliente;
}

function fields(formData: FormData) {
  return {
    nombre: formData.get("nombre"),
    email: formData.get("email"),
    password: formData.get("password"),
  };
}

async function persistSession(accessToken: string): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 15 * 60,
    priority: "high",
  });
}

export async function loginAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = loginSchema.safeParse(fields(formData));
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  let response: LoginResponse;
  try {
    response = await apiRequest<LoginResponse>(
      "/auth/login",
      { method: "POST", body: JSON.stringify(parsed.data) },
      false,
    );
    await persistSession(response.accessToken);
  } catch (error) {
    return errorToFormState(error);
  }

  redirect("/pedidos");
}

export async function registerAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = registerSchema.safeParse(fields(formData));
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  let response: LoginResponse;
  try {
    await apiRequest<Cliente>(
      "/auth/registro",
      { method: "POST", body: JSON.stringify(parsed.data) },
      false,
    );
    response = await apiRequest<LoginResponse>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({
          email: parsed.data.email,
          password: parsed.data.password,
        }),
      },
      false,
    );
    await persistSession(response.accessToken);
  } catch (error) {
    return errorToFormState(error);
  }

  redirect("/pedidos");
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  try {
    await apiRequest("/auth/logout", { method: "POST" });
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
  } finally {
    cookieStore.delete(SESSION_COOKIE);
  }
  redirect("/login");
}
