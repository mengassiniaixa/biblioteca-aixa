import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BookForm } from "./BookForm";
import type { Book } from "../../api/types";

const sampleBook: Book = {
  id: "b1",
  isbn: "978-1",
  title: "Dune",
  author: "Herbert",
  category: "SciFi",
  totalCopies: 3,
  availableCopies: 2,
};

describe("BookForm", () => {
  it("crea con todos los campos incluido ISBN", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<BookForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/isbn/i), "978-9");
    await user.type(screen.getByLabelText(/título/i), "Nuevo");
    await user.type(screen.getByLabelText(/autor/i), "Autor");
    await user.type(screen.getByLabelText(/categoría/i), "Cat");
    await user.clear(screen.getByLabelText(/copias totales/i));
    await user.type(screen.getByLabelText(/copias totales/i), "5");
    await user.click(screen.getByRole("button", { name: /crear libro/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      mode: "create",
      values: {
        isbn: "978-9",
        title: "Nuevo",
        author: "Autor",
        category: "Cat",
        totalCopies: 5,
      },
    });
  });

  it("en modo edit no muestra ISBN y envía sólo campos editables", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <BookForm mode="edit" initialValues={sampleBook} onSubmit={onSubmit} />,
    );

    expect(screen.queryByLabelText(/isbn/i)).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText(/título/i));
    await user.type(screen.getByLabelText(/título/i), "Dune Deluxe");
    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      mode: "edit",
      values: {
        title: "Dune Deluxe",
        author: "Herbert",
        category: "SciFi",
        totalCopies: 3,
      },
    });
  });

  it("dispara onCancel al tocar Cancelar", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<BookForm onSubmit={() => {}} onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("muestra el error y bloquea el botón al enviar", () => {
    render(
      <BookForm
        onSubmit={() => {}}
        isSubmitting
        errorMessage="El ISBN ya existe"
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("El ISBN ya existe");
    expect(screen.getByRole("button", { name: /guardando/i })).toBeDisabled();
  });
});
