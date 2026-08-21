import Link from "next/link";

export default function NotFound() {
  return (
    <main className="standalone-state">
      <span className="empty-code">404</span>
      <h1>Ese registro no existe</h1>
      <p>Puede haber sido eliminado o la dirección no es correcta.</p>
      <Link className="button primary" href="/pedidos">Volver a pedidos</Link>
    </main>
  );
}
