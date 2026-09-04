import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BookList } from "./BookList";
import type { Book, Loan, Reservation } from "../../api/types";

const sample: Book[] = [
  {
    id: "b1",
    isbn: "978-1",
    title: "Dune",
    author: "Herbert",
    category: "SciFi",
    totalCopies: 3,
    availableCopies: 2,
  },
  {
    id: "b2",
    isbn: "978-2",
    title: "Hobbit",
    author: "Tolkien",
    category: "Fantasía",
    totalCopies: 1,
    availableCopies: 0,
  },
];

function makeLoan(overrides: Partial<Loan> = {}): Loan {
  return {
    id: "loan-1",
    bookId: "b1",
    userId: "u1",
    loanDate: "2026-08-01T00:00:00.000Z",
    dueDate: "2026-08-15T00:00:00.000Z",
    status: "ACTIVE",
    book: { id: "b1", title: "Dune", author: "Herbert", isbn: "978-1" },
    ...overrides,
  };
}

function makeReservation(overrides: Partial<Reservation> = {}): Reservation {
  return {
    id: "res-1",
    bookId: "b2",
    userId: "u1",
    reservationDate: "2026-08-01T00:00:00.000Z",
    status: "PENDING",
    book: { id: "b2", title: "Hobbit", author: "Tolkien", isbn: "978-2" },
    ...overrides,
  };
}

describe("BookList", () => {
  it("muestra un mensaje cuando no hay libros", () => {
    render(<BookList books={[]} />);
    expect(screen.getByText(/no hay libros/i)).toBeInTheDocument();
  });

  it("renderiza los datos principales de cada libro", () => {
    render(<BookList books={sample} />);
    expect(screen.getByText("Dune")).toBeInTheDocument();
    expect(screen.getByText("Herbert")).toBeInTheDocument();
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
    expect(screen.getByText("Hobbit")).toBeInTheDocument();
    expect(screen.getByText("0 / 1")).toBeInTheDocument();
  });

  it("no muestra acciones si no se habilita canManage ni canMember", () => {
    render(<BookList books={sample} />);
    expect(screen.queryByRole("button", { name: /editar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /eliminar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /prestar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /reservar/i })).not.toBeInTheDocument();
  });

  it("dispara los callbacks al tocar editar / eliminar cuando canManage", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <BookList books={sample} canManage onEdit={onEdit} onDelete={onDelete} />,
    );

    const editButtons = screen.getAllByRole("button", { name: /editar/i });
    await user.click(editButtons[0]);
    expect(onEdit).toHaveBeenCalledWith(sample[0]);

    const deleteButtons = screen.getAllByRole("button", { name: /eliminar/i });
    await user.click(deleteButtons[1]);
    expect(onDelete).toHaveBeenCalledWith(sample[1]);
  });

  describe("acciones MEMBER", () => {
    it("muestra Prestar cuando el libro tiene copias y el usuario no tiene loan/reserva", async () => {
      const user = userEvent.setup();
      const onLoan = vi.fn();
      render(
        <BookList
          books={sample}
          canMember
          myLoans={[]}
          myReservations={[]}
          onLoan={onLoan}
        />,
      );
      const prestar = screen.getByRole("button", { name: /^prestar$/i });
      await user.click(prestar);
      expect(onLoan).toHaveBeenCalledWith("b1");
    });

    it("muestra Reservar cuando el libro no tiene copias disponibles", async () => {
      const user = userEvent.setup();
      const onReserve = vi.fn();
      render(
        <BookList
          books={sample}
          canMember
          myLoans={[]}
          myReservations={[]}
          onReserve={onReserve}
        />,
      );
      const reservar = screen.getByRole("button", { name: /^reservar$/i });
      await user.click(reservar);
      expect(onReserve).toHaveBeenCalledWith("b2");
    });

    it("muestra Devolver cuando el usuario ya tiene un préstamo activo del libro", async () => {
      const user = userEvent.setup();
      const onReturn = vi.fn();
      render(
        <BookList
          books={sample}
          canMember
          myLoans={[makeLoan({ id: "loan-42", bookId: "b1" })]}
          myReservations={[]}
          onReturn={onReturn}
        />,
      );
      const devolver = screen.getByRole("button", { name: /devolver/i });
      await user.click(devolver);
      expect(onReturn).toHaveBeenCalledWith("loan-42");
    });

    it("muestra Cancelar reserva cuando el usuario ya reservó ese libro", async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      render(
        <BookList
          books={sample}
          canMember
          myLoans={[]}
          myReservations={[
            makeReservation({ id: "res-99", bookId: "b2", status: "PENDING" }),
          ]}
          onCancelReservation={onCancel}
        />,
      );
      const cancelar = screen.getByRole("button", { name: /cancelar reserva/i });
      await user.click(cancelar);
      expect(onCancel).toHaveBeenCalledWith("res-99");
    });

    it("deshabilita las acciones MEMBER mientras hay una mutation en curso", () => {
      render(
        <BookList
          books={sample}
          canMember
          myLoans={[]}
          myReservations={[]}
          isMemberActionPending
        />,
      );
      expect(screen.getByRole("button", { name: /^prestar$/i })).toBeDisabled();
      expect(screen.getByRole("button", { name: /^reservar$/i })).toBeDisabled();
    });
  });
});
