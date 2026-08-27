"use client";

import { useActionState, useDeferredValue, useState } from "react";

import { SubmitButton } from "@/shared/components/submit-button";
import { formatCurrency } from "@/shared/lib/formatters";
import { INITIAL_FORM_STATE } from "@/shared/lib/form-state";
import type { Articulo, Cliente } from "@/shared/types/domain";
import { saveOrderAction } from "../actions";
import type { OrderLineInput } from "../schemas";

interface OrderEditorProps {
  clientes: Cliente[];
  articulos: Articulo[];
  pedidoId?: number;
  clienteId?: number;
  fechaEntrega?: string | null;
  initialLines?: OrderLineInput[];
}

export function OrderEditor({
  clientes,
  articulos,
  pedidoId = 0,
  clienteId,
  fechaEntrega,
  initialLines = [],
}: OrderEditorProps) {
  const [state, action] = useActionState(saveOrderAction, INITIAL_FORM_STATE);
  const [lines, setLines] = useState<OrderLineInput[]>(initialLines);
  const deferredLines = useDeferredValue(lines);
  const available = articulos.filter(
    (article) => !lines.some((line) => line.articuloId === article.id),
  );
  const estimatedTotal = deferredLines.reduce((total, line) => {
    const article = articulos.find((item) => item.id === line.articuloId);
    const gross = Number(article?.precioUnitario ?? 0) * line.cantidad;
    return total + gross * (1 - line.descuento / 100);
  }, 0);

  function addLine() {
    const article = available[0];
    if (!article) return;
    setLines((current) => [
      ...current,
      { articuloId: article.id, cantidad: 1, descuento: 0 },
    ]);
  }

  function updateLine(index: number, patch: Partial<OrderLineInput>) {
    setLines((current) =>
      current.map((line, lineIndex) =>
        lineIndex === index ? { ...line, ...patch } : line,
      ),
    );
  }

  function removeLine(index: number) {
    setLines((current) => current.filter((_, lineIndex) => lineIndex !== index));
  }

  return (
    <form action={action} className="order-editor">
      <input name="pedidoId" type="hidden" value={pedidoId} />
      <input name="detalles" type="hidden" value={JSON.stringify(lines)} />

      <section className="panel order-header-card">
        <div className="section-number">A</div>
        <div className="section-copy">
          <p className="eyebrow">Cabecera</p>
          <h2>Datos del pedido</h2>
        </div>
        <div className="order-header-fields">
          <div className="field span-2">
            <label htmlFor="clienteId">Cliente</label>
            <select
              id="clienteId"
              name="clienteId"
              defaultValue={clienteId ?? ""}
              required
            >
              <option value="" disabled>Seleccionar cliente</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="fechaEntrega">Fecha de entrega</label>
            <input
              id="fechaEntrega"
              name="fechaEntrega"
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              defaultValue={fechaEntrega?.slice(0, 10) ?? ""}
            />
          </div>
        </div>
      </section>

      <section className="panel order-lines-card">
        <div className="lines-heading">
          <div className="section-number">B</div>
          <div className="section-copy">
            <p className="eyebrow">Detalle</p>
            <h2>Líneas del pedido</h2>
          </div>
          <button
            className="button secondary"
            type="button"
            onClick={addLine}
            disabled={available.length === 0}
          >
            + Agregar línea
          </button>
        </div>

        <div className="line-list">
          {lines.map((line, index) => {
            const article = articulos.find((item) => item.id === line.articuloId);
            const lineArticles = articulos.filter(
              (item) =>
                item.id === line.articuloId ||
                !lines.some(
                  (otherLine, otherIndex) =>
                    otherIndex !== index && otherLine.articuloId === item.id,
                ),
            );
            const amount =
              Number(article?.precioUnitario ?? 0) *
              line.cantidad *
              (1 - line.descuento / 100);
            return (
              <div className="order-line" key={`${line.articuloId}-${index}`}>
                <div className="line-product">
                  <span className="line-index">{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <label className="sr-only" htmlFor={`articulo-${index}`}>
                      Artículo de la línea {index + 1}
                    </label>
                    <select
                      id={`articulo-${index}`}
                      value={line.articuloId}
                      onChange={(event) =>
                        updateLine(index, { articuloId: Number(event.target.value) })
                      }
                    >
                      {lineArticles.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.nombre}
                        </option>
                      ))}
                    </select>
                    <span>{article?.codigo} · Stock {article?.stock ?? 0}</span>
                  </div>
                </div>
                <div className="field compact">
                  <label htmlFor={`cantidad-${index}`}>Cantidad</label>
                  <input
                    id={`cantidad-${index}`}
                    type="number"
                    min="1"
                    step="1"
                    value={line.cantidad}
                    onChange={(event) =>
                      updateLine(index, { cantidad: Number(event.target.value) })
                    }
                  />
                </div>
                <div className="field compact">
                  <label htmlFor={`descuento-${index}`}>Descuento %</label>
                  <input
                    id={`descuento-${index}`}
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={line.descuento}
                    onChange={(event) =>
                      updateLine(index, { descuento: Number(event.target.value) })
                    }
                  />
                </div>
                <div className="line-amount">
                  <span>Importe estimado</span>
                  <strong>{formatCurrency(amount)}</strong>
                </div>
                <button
                  className="icon-button danger"
                  type="button"
                  onClick={() => removeLine(index)}
                  aria-label={`Eliminar línea ${index + 1}`}
                >
                  ×
                </button>
              </div>
            );
          })}
          {lines.length === 0 && (
            <div className="empty-lines">
              <p>No hay artículos en el pedido.</p>
              <button className="text-button" type="button" onClick={addLine}>
                Agregar la primera línea
              </button>
            </div>
          )}
        </div>

        <footer className="order-summary">
          <p>El backend recalcula precios e importes antes de guardar.</p>
          <div>
            <span>Total estimado</span>
            <strong>{formatCurrency(estimatedTotal)}</strong>
          </div>
        </footer>
      </section>

      {state.message && <p className="form-message error">{state.message}</p>}
      {state.errors && (
        <p className="form-message error" role="alert">
          {Object.values(state.errors).flat()[0]}
        </p>
      )}

      <div className="form-actions sticky-actions">
        <SubmitButton pendingLabel="Guardando pedido…">
          {pedidoId ? "Guardar cambios" : "Crear pedido"}
        </SubmitButton>
      </div>
    </form>
  );
}
