"use client";

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <section className="empty-state" role="alert">
      <span className="empty-code">!</span>
      <h1>No pudimos cargar esta sección</h1>
      <p>Verificá que la API y PostgreSQL estén disponibles.</p>
      <button className="button primary" onClick={reset} type="button">
        Reintentar
      </button>
    </section>
  );
}
