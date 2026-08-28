import type { Metadata } from "next";

import { deleteClienteAction } from "@/features/clientes/actions";
import { ClienteForm } from "@/features/clientes/components/cliente-form";
import { getClientes } from "@/features/clientes/service";
import { ActionButton } from "@/shared/components/action-button";

export const metadata: Metadata = { title: "Clientes" };

export default async function ClientesPage() {
  const clientes = await getClientes();

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Directorio comercial</p>
          <h1>Clientes</h1>
          <p className="muted">{clientes.length} fichas activas en el sistema.</p>
        </div>
        <span className="header-index">02</span>
      </header>

      <section className="panel create-panel">
        <div className="panel-heading">
          <h2>Nueva ficha</h2>
          <p>Los usuarios con acceso se crean desde el registro público.</p>
        </div>
        <ClienteForm />
      </section>

      <section className="panel table-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Email de acceso</th>
                <th aria-label="Acciones" />
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente) => (
                <tr key={cliente.id}>
                  <td data-label="Cliente">
                    <strong>{cliente.nombre}</strong>
                    <span className="record-id">CLI-{String(cliente.id).padStart(4, "0")}</span>
                  </td>
                  <td data-label="Email">{cliente.email ?? "Sin acceso asociado"}</td>
                  <td className="action-cell">
                    <ActionButton
                      action={deleteClienteAction.bind(null, cliente.id)}
                      className="text-button danger"
                      pendingLabel="Eliminando…"
                    >
                      Eliminar
                    </ActionButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {clientes.length === 0 && <p className="empty-row">Todavía no hay clientes.</p>}
      </section>
    </>
  );
}
