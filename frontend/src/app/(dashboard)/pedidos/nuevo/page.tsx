import type { Metadata } from "next";
import Link from "next/link";

import { getArticulos } from "@/features/articulos/service";
import { getClientes } from "@/features/clientes/service";
import { OrderEditor } from "@/features/pedidos/components/order-editor";

export const metadata: Metadata = { title: "Nuevo pedido" };

export default async function NuevoPedidoPage() {
  const [clientes, articulos] = await Promise.all([getClientes(), getArticulos()]);

  return (
    <>
      <header className="page-header compact-header">
        <div>
          <Link className="back-link" href="/pedidos">← Volver a pedidos</Link>
          <p className="eyebrow">Alta de venta</p>
          <h1>Nuevo pedido</h1>
        </div>
        <span className="header-index">N</span>
      </header>
      {clientes.length > 0 && articulos.length > 0 ? (
        <OrderEditor clientes={clientes} articulos={articulos} />
      ) : (
        <section className="empty-state">
          <h2>Faltan datos maestros</h2>
          <p>Necesitás al menos un cliente y un artículo antes de crear pedidos.</p>
          <div className="form-actions">
            <Link className="button secondary" href="/clientes">Ir a clientes</Link>
            <Link className="button primary" href="/articulos">Ir a artículos</Link>
          </div>
        </section>
      )}
    </>
  );
}
