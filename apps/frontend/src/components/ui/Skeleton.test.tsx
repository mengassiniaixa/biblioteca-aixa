import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Skeleton, TableSkeleton } from "./Skeleton";

describe("Skeleton", () => {
  it("renderiza un div oculto para lectores con clase animate-pulse", () => {
    const { container } = render(<Skeleton />);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toHaveAttribute("aria-hidden", "true");
    expect(el.className).toContain("animate-pulse");
  });

  it("propaga className adicional", () => {
    const { container } = render(<Skeleton className="h-8 w-32" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain("h-8");
    expect(el.className).toContain("w-32");
  });
});

describe("TableSkeleton", () => {
  it("expone role status con aria-label", () => {
    render(<TableSkeleton ariaLabel="Cargando libros" />);
    expect(
      screen.getByRole("status", { name: /cargando libros/i }),
    ).toBeInTheDocument();
  });

  it("respeta rows y columns", () => {
    const { container } = render(<TableSkeleton rows={2} columns={3} />);
    // 1 header row + 2 body rows = 3 rows totales; cada uno con 3 columnas
    const skeletonCells = container.querySelectorAll("[aria-hidden='true']");
    expect(skeletonCells.length).toBe(3 * 3);
  });
});
