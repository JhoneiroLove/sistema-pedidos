import type { EstadoPedido } from "@/shared/types/domain";

const labels: Record<EstadoPedido, string> = {
  BORRADOR: "Borrador",
  CONFIRMADO: "Confirmado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

export function StatusBadge({ status }: { status: EstadoPedido }) {
  return <span className={`status status-${status.toLowerCase()}`}>{labels[status]}</span>;
}
