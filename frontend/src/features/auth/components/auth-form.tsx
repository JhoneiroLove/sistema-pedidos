"use client";

import Link from "next/link";
import { useActionState } from "react";

import { INITIAL_FORM_STATE, type FormState } from "@/shared/lib/form-state";

interface AuthFormProps {
  mode: "login" | "register";
  action: (state: FormState, data: FormData) => Promise<FormState>;
}

export function AuthForm({ mode, action }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(
    action,
    INITIAL_FORM_STATE,
  );
  const registering = mode === "register";

  return (
    <form action={formAction} className="auth-form" noValidate>
      {registering && (
        <div className="field">
          <label htmlFor="nombre">Nombre completo</label>
          <input id="nombre" name="nombre" autoComplete="name" maxLength={150} />
          <FieldError errors={state.errors?.nombre} />
        </div>
      )}

      <div className="field">
        <label htmlFor="email">Correo electrónico</label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          maxLength={254}
          required
        />
        <FieldError errors={state.errors?.email} />
      </div>

      <div className="field">
        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={registering ? "new-password" : "current-password"}
          minLength={registering ? 12 : 8}
          maxLength={200}
          required
        />
        {registering && <p className="field-hint">Mínimo 12 caracteres.</p>}
        <FieldError errors={state.errors?.password} />
      </div>

      {state.message && (
        <p className="form-message error" role="alert">
          {state.message}
        </p>
      )}

      <button className="button primary wide" disabled={pending} type="submit">
        {pending
          ? "Procesando…"
          : registering
            ? "Crear cuenta"
            : "Ingresar"}
      </button>

      <p className="auth-switch">
        {registering ? "¿Ya tenés una cuenta?" : "¿Primera vez por acá?"}{" "}
        <Link href={registering ? "/login" : "/registro"}>
          {registering ? "Ingresá" : "Registrate"}
        </Link>
      </p>
    </form>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p className="field-error" role="alert">
      {errors[0]}
    </p>
  );
}
