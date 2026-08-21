import type { Metadata } from "next";
import Link from "next/link";

import { StatusBadge } from "@/features/pedidos/components/status-badge";
import { getPedidos } from "@/features/pedidos/service";
import { calculateOrderTotal, formatCurrency, formatDate } from "@/shared/lib/formatters";

export const metadata: Metadata = { title: "Pedidos" };

export default async function PedidosPage() {
  const pedidos = await getPedidos();
  const pending = pedidos.filter((pedido) => pedido.estado === "BORRADOR").length;
  const confirmed = pedidos.filter((pedido) => pedido.estado === "CONFIRMADO").length;
  const volume = pedidos.reduce(
    (total, pedido) => total + calculateOrderTotal(pedido.lineas),
    0,
  );

  return (
    <>
      <header className="page-header orders-title">
        <div>
          <p className="eyebrow">Mesa de operaciones</p>
          <h1>Pedidos</h1>
          <p className="muted">Seguimiento integral de ventas y entregas.</p>
        </div>
        <Link className="button primary" href="/pedidos/nuevo">
          + Nuevo pedido
        </Link>
      </header>

      <section className="metric-strip" aria-label="Resumen de pedidos">
        <article>
          <span className="metric-label">Borradores</span>
          <strong>{String(pending).padStart(2, "0")}</strong>
          <small>requieren revisión</small>
        </article>
        <article>
          <span className="metric-label">Confirmados</span>
          <strong>{String(confirmed).padStart(2, "0")}</strong>
          <small>en preparación</small>
        </article>
        <article className="wide-metric">
          <span className="metric-label">Volumen registrado</span>
          <strong>{formatCurrency(volume)}</strong>
          <small>sobre {pedidos.length} pedidos</small>
        </article>
      </section>

      <section className="panel table-panel orders-table">
        <div className="panel-heading inline">
          <div>
            <p className="eyebrow">Registro reciente</p>
            <h2>Todos los pedidos</h2>
          </div>
          <span className="record-count">{pedidos.length} registros</span>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Número</th>
                <th>Cliente</th>
                <th>Pedido</th>
                <th>Entrega</th>
                <th>Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((pedido) => (
                <tr key={pedido.id}>
                  <td data-label="Número">
                    <Link className="order-link" href={`/pedidos/${pedido.id}`}>
                      {pedido.numeroPedido}
                    </Link>
                    <span className="record-id">{pedido.lineas.length} líneas</span>
                  </td>
                  <td data-label="Cliente"><strong>{pedido.cliente.nombre}</strong></td>
                  <td data-label="Pedido">{formatDate(pedido.fechaPedido)}</td>
                  <td data-label="Entrega">{formatDate(pedido.fechaEntrega)}</td>
                  <td data-label="Total" className="money-cell">
                    {formatCurrency(calculateOrderTotal(pedido.lineas))}
                  </td>
                  <td data-label="Estado"><StatusBadge status={pedido.estado} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pedidos.length === 0 && (
          <div className="empty-state compact">
            <h2>No hay pedidos registrados</h2>
            <p>Creá el primero para empezar a operar.</p>
          </div>
        )}
      </section>
    </>
  );
}
