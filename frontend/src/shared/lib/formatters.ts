const currency = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

const date = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function formatCurrency(value: string | number): string {
  return currency.format(Number(value));
}

export function formatDate(value: string | null): string {
  return value ? date.format(new Date(value)) : "Sin definir";
}

export function calculateOrderTotal(
  lines: ReadonlyArray<{ importe: string | number }>,
): number {
  return lines.reduce((total, line) => total + Number(line.importe), 0);
}
