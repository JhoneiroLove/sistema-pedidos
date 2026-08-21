import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatusBadge } from "./status-badge";

describe("StatusBadge", () => {
  it("traduce el estado técnico para el usuario", () => {
    render(<StatusBadge status="CONFIRMADO" />);

    expect(screen.getByText("Confirmado")).toHaveClass("status-confirmado");
  });
});
