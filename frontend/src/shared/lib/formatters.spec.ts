import { describe, expect, it } from "vitest";

import { calculateOrderTotal, formatDate } from "./formatters";

describe("formatters", () => {
  it("suma importes serializados como string", () => {
    expect(calculateOrderTotal([{ importe: "10.50" }, { importe: "9.50" }])).toBe(
      20,
    );
  });

  it("presenta una fecha pendiente sin inventar un valor", () => {
    expect(formatDate(null)).toBe("Sin definir");
  });
});
