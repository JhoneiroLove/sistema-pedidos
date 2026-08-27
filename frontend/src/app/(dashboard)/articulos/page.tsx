import type { Metadata } from "next";

import { deleteArticuloAction } from "@/features/articulos/actions";
import { ArticuloForm } from "@/features/articulos/components/articulo-form";
import { getArticulos } from "@/features/articulos/service";
import { ActionButton } from "@/shared/components/action-button";
import { formatCurrency } from "@/shared/lib/formatters";

export const metadata: Metadata = { title: "Artículos" };

export default async function ArticulosPage() {
  const articulos = await getArticulos();
  const stockTotal = articulos.reduce((total, item) => total + item.stock, 0);

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Catálogo y existencias</p>
          <h1>Artículos</h1>
          <p className="muted">
            {articulos.length} referencias · {stockTotal} unidades disponibles.
          </p>
        </div>
        <span className="header-index">03</span>
      </header>

      <section className="panel create-panel">
        <div className="panel-heading">
          <h2>Nuevo artículo</h2>
          <p>El precio se copiará en cada línea para conservar el histórico.</p>
        </div>
        <ArticuloForm />
      </section>

      <section className="catalog-grid" aria-label="Catálogo de artículos">
        {articulos.map((articulo) => (
          <article className="product-card" key={articulo.id}>
            <div className="product-code">{articulo.codigo}</div>
            <h2>{articulo.nombre}</h2>
            <div className="product-data">
              <span>
                Precio<strong>{formatCurrency(articulo.precioUnitario)}</strong>
              </span>
              <span>
                Stock<strong className={articulo.stock < 5 ? "low-stock" : ""}>{articulo.stock}</strong>
              </span>
            </div>
            <ActionButton
              action={deleteArticuloAction.bind(null, articulo.id)}
              className="text-button danger"
              pendingLabel="Eliminando…"
            >
              Eliminar del catálogo
            </ActionButton>
          </article>
        ))}
        {articulos.length === 0 && (
          <div className="empty-state compact">
            <h2>El catálogo está vacío</h2>
            <p>Agregá el primer artículo desde el formulario superior.</p>
          </div>
        )}
      </section>
    </>
  );
}
