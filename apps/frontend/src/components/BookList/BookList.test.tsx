import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BookList } from "./BookList";
import type { Book } from "../../api/types";

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

  it("no muestra acciones si canManage es false", () => {
    render(<BookList books={sample} />);
    expect(screen.queryByRole("button", { name: /editar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /eliminar/i })).not.toBeInTheDocument();
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
});
