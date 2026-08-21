import { ApiError } from "./api-error";

export interface FormState {
  message?: string;
  errors?: Record<string, string[]>;
}

export const INITIAL_FORM_STATE: FormState = {};

export function errorToFormState(error: unknown): FormState {
  if (error instanceof ApiError) return { message: error.message };
  return { message: "Ocurrió un error inesperado. Intentá nuevamente." };
}
