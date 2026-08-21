import { describe, expect, it } from "vitest";

import { orderSchema } from "./schemas";

describe("orderSchema", () => {
  const validOrder = {
    pedidoId: 0,
    clienteId: 1,
    fechaEntrega: "2026-08-30",
    detalles: [{ articuloId: 2, cantidad: 3, descuento: 10 }],
  };

  it("acepta una cabecera con líneas válidas", () => {
    expect(orderSchema.safeParse(validOrder).success).toBe(true);
  });

  it("rechaza pedidos sin líneas", () => {
    expect(
      orderSchema.safeParse({ ...validOrder, detalles: [] }).success,
    ).toBe(false);
  });

  it("rechaza descuentos fuera de rango", () => {
    const result = orderSchema.safeParse({
      ...validOrder,
      detalles: [{ articuloId: 2, cantidad: 1, descuento: 101 }],
    });
    expect(result.success).toBe(false);
  });
});
