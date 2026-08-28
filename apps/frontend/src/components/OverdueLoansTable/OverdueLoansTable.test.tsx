import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { OverdueLoansTable } from "./OverdueLoansTable";
import type { OverdueLoan } from "../../api/types";

function makeOverdue(overrides: Partial<OverdueLoan> = {}): OverdueLoan {
  return {
    id: "loan-1",
    loanDate: "2026-01-01T00:00:00.000Z",
    dueDate: "2026-01-15T00:00:00.000Z",
    daysOverdue: 17,
    book: {
      id: "b1",
      title: "Dune",
      author: "Frank Herbert",
      isbn: "9780441172719",
    },
    member: {
      id: "u1",
      name: "Ana",
      email: "ana@test.com",
    },
    ...overrides,
  };
}

describe("OverdueLoansTable", () => {
  it("muestra un mensaje cuando no hay préstamos vencidos", () => {
    render(<OverdueLoansTable loans={[]} />);
    expect(screen.getByText(/no hay préstamos vencidos/i)).toBeInTheDocument();
  });

  it("renderiza libro y socio de cada préstamo", () => {
    render(
      <OverdueLoansTable
        loans={[
          makeOverdue(),
          makeOverdue({
            id: "loan-2",
            book: {
              id: "b2",
              title: "El Hobbit",
              author: "Tolkien",
              isbn: "9780618968633",
            },
            member: {
              id: "u2",
              name: "Beto",
              email: "beto@test.com",
            },
          }),
        ]}
      />,
    );
    expect(screen.getByText("Dune")).toBeInTheDocument();
    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("ana@test.com")).toBeInTheDocument();
    expect(screen.getByText("El Hobbit")).toBeInTheDocument();
    expect(screen.getByText("Beto")).toBeInTheDocument();
  });

  it("muestra 'día' en singular cuando daysOverdue es 1", () => {
    render(<OverdueLoansTable loans={[makeOverdue({ daysOverdue: 1 })]} />);
    expect(screen.getByText(/^1 día$/)).toBeInTheDocument();
  });

  it("muestra 'días' en plural cuando daysOverdue es mayor a 1", () => {
    render(<OverdueLoansTable loans={[makeOverdue({ daysOverdue: 17 })]} />);
    expect(screen.getByText(/^17 días$/)).toBeInTheDocument();
  });
});
