"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/shared/components/submit-button";
import { INITIAL_FORM_STATE } from "@/shared/lib/form-state";
import { createArticuloAction } from "../actions";

export function ArticuloForm() {
  const [state, action] = useActionState(
    createArticuloAction,
    INITIAL_FORM_STATE,
  );

  return (
    <form action={action} className="catalog-form">
      <div className="field">
        <label htmlFor="codigo">Código</label>
        <input id="codigo" name="codigo" maxLength={50} required />
      </div>
      <div className="field span-2">
        <label htmlFor="articulo-nombre">Nombre</label>
        <input id="articulo-nombre" name="nombre" maxLength={150} required />
      </div>
      <div className="field">
        <label htmlFor="precio">Precio unitario</label>
        <input id="precio" name="precioUnitario" type="number" min="0" step="0.01" required />
      </div>
      <div className="field">
        <label htmlFor="stock">Stock</label>
        <input id="stock" name="stock" type="number" min="0" step="1" required />
      </div>
      <SubmitButton>Agregar artículo</SubmitButton>
      {state.message && <p className="form-message span-all">{state.message}</p>}
      {state.errors && (
        <p className="field-error span-all" role="alert">
          {Object.values(state.errors).flat()[0]}
        </p>
      )}
    </form>
  );
}
