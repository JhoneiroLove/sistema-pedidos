import { describe, expect, it } from "vitest";

import { loginSchema, registerSchema } from "./schemas";

describe("esquemas de autenticación", () => {
  it("acepta credenciales válidas", () => {
    expect(
      loginSchema.safeParse({
        email: "ada@example.com",
        password: "Clave-Segura-123",
      }).success,
    ).toBe(true);
  });

  it("rechaza email inválido y contraseña corta al registrar", () => {
    const result = registerSchema.safeParse({
      nombre: "Ada",
      email: "email-inválido",
      password: "corta",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
        expect.arrayContaining(["email", "password"]),
      );
    }
  });
});
