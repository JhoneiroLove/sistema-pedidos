"use client";

import { useActionState } from "react";

import { INITIAL_FORM_STATE } from "@/shared/lib/form-state";
import { SubmitButton } from "@/shared/components/submit-button";
import { createClienteAction } from "../actions";

export function ClienteForm() {
  const [state, action] = useActionState(
    createClienteAction,
    INITIAL_FORM_STATE,
  );

  return (
    <form action={action} className="compact-form">
      <div className="field grow">
        <label htmlFor="cliente-nombre">Nombre o razón social</label>
        <input
          id="cliente-nombre"
          name="nombre"
          maxLength={150}
          placeholder="Ej. Estudio Norte"
          required
        />
        {state.errors?.nombre && (
          <p className="field-error">{state.errors.nombre[0]}</p>
        )}
      </div>
      <SubmitButton>Agregar cliente</SubmitButton>
      {state.message && <p className="form-message">{state.message}</p>}
    </form>
  );
}
