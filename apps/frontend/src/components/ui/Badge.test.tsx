import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "./Badge";

describe("Badge", () => {
  it("renderiza el texto", () => {
    render(<Badge>LIBRARIAN</Badge>);
    expect(screen.getByText("LIBRARIAN")).toBeInTheDocument();
  });

  it("aplica clases del tono danger", () => {
    render(<Badge tone="danger">Vencido</Badge>);
    const badge = screen.getByText("Vencido");
    expect(badge.className).toMatch(/text-accent-hover/);
  });

  it("respeta className adicional", () => {
    render(<Badge className="ml-2">Nuevo</Badge>);
    expect(screen.getByText("Nuevo").className).toContain("ml-2");
  });
});
