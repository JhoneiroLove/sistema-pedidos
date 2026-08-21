import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getArticulos } from "@/features/articulos/service";
import { getClientes } from "@/features/clientes/service";
import {
  deleteOrderAction,
  transitionOrderAction,
} from "@/features/pedidos/actions";
import { OrderEditor } from "@/features/pedidos/components/order-editor";
import { StatusBadge } from "@/features/pedidos/components/status-badge";
import { getPedido } from "@/features/pedidos/service";
import { SubmitButton } from "@/shared/components/submit-button";
import { ApiError } from "@/shared/lib/api-client";
import { calculateOrderTotal, formatCurrency, formatDate } from "@/shared/lib/formatters";

export const metadata: Metadata = { title: "Detalle del pedido" };

export default async function PedidoDetailPage({
  params,
}: PageProps<"/pedidos/[id]">) {
  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId) || orderId < 1) notFound();

  let pedido;
  try {
    pedido = await getPedido(orderId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const editable = pedido.estado === "BORRADOR";
  const [clientes, articulos] = editable
    ? await Promise.all([getClientes(), getArticulos()])
    : [[], []];

  return (
    <>
      <header className="page-header order-detail-header">
        <div>
          <Link className="back-link" href="/pedidos">← Volver a pedidos</Link>
          <p className="eyebrow">Pedido de venta</p>
          <h1>{pedido.numeroPedido}</h1>
          <div className="detail-meta">
            <StatusBadge status={pedido.estado} />
            <span>Creado {formatDate(pedido.fechaPedido)}</span>
          </div>
        </div>
        <div className="order-actions">
          {pedido.estado === "BORRADOR" && (
            <>
              <form action={transitionOrderAction.bind(null, pedido.id, "confirmar")}>
                <SubmitButton pendingLabel="Confirmando…">Confirmar</SubmitButton>
              </form>
              <form action={deleteOrderAction.bind(null, pedido.id)}>
                <SubmitButton className="button danger" pendingLabel="Eliminando…">
                  Eliminar
                </SubmitButton>
              </form>
            </>
          )}
          {pedido.estado === "CONFIRMADO" && (
            <>
              <form action={transitionOrderAction.bind(null, pedido.id, "entregar")}>
                <SubmitButton pendingLabel="Entregando…">Marcar entregado</SubmitButton>
              </form>
              <form action={transitionOrderAction.bind(null, pedido.id, "cancelar")}>
                <SubmitButton className="button danger" pendingLabel="Cancelando…">
                  Cancelar
                </SubmitButton>
              </form>
            </>
          )}
        </div>
      </header>

      {editable ? (
        <OrderEditor
          clientes={clientes}
          articulos={articulos}
          pedidoId={pedido.id}
          clienteId={pedido.clienteId}
          fechaEntrega={pedido.fechaEntrega}
          initialLines={pedido.lineas.map((linea) => ({
            articuloId: linea.articuloId,
            cantidad: linea.cantidad,
            descuento: Number(linea.descuento),
          }))}
        />
      ) : (
        <section className="panel readonly-order">
          <div className="readonly-header">
            <div>
              <span>Cliente</span>
              <strong>{pedido.cliente.nombre}</strong>
            </div>
            <div>
              <span>Entrega</span>
              <strong>{formatDate(pedido.fechaEntrega)}</strong>
            </div>
            <div>
              <span>Total</span>
              <strong>{formatCurrency(calculateOrderTotal(pedido.lineas))}</strong>
            </div>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Artículo</th>
                  <th>Cantidad</th>
                  <th>Precio</th>
                  <th>Descuento</th>
                  <th>Importe</th>
                </tr>
              </thead>
              <tbody>
                {pedido.lineas.map((linea) => (
                  <tr key={linea.id}>
                    <td data-label="Artículo">
                      <strong>{linea.articulo.nombre}</strong>
                      <span className="record-id">{linea.articulo.codigo}</span>
                    </td>
                    <td data-label="Cantidad">{linea.cantidad}</td>
                    <td data-label="Precio">{formatCurrency(linea.precioUnitario)}</td>
                    <td data-label="Descuento">{linea.descuento}%</td>
                    <td data-label="Importe" className="money-cell">{formatCurrency(linea.importe)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
