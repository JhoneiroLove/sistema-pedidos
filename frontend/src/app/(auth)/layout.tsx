export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="auth-page">
      <section className="auth-story" aria-label="Presentación">
        <div className="brand-mark">TR</div>
        <div>
          <p className="eyebrow">Sistema comercial</p>
          <h1>Pedidos claros.<br />Decisiones rápidas.</h1>
          <p className="auth-lead">
            Una bitácora digital para clientes, catálogo y ventas, diseñada para
            trabajar desde cualquier pantalla.
          </p>
        </div>
        <p className="auth-footnote">TRAMA / OPERACIONES 2026</p>
      </section>
      <section className="auth-panel">{children}</section>
    </main>
  );
}
