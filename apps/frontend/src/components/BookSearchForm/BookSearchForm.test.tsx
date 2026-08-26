import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BookSearchForm } from "./BookSearchForm";

describe("BookSearchForm", () => {
  it("dispara onSubmit con los campos rellenados", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<BookSearchForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/título/i), "  Hobbit  ");
    await user.type(screen.getByLabelText(/autor/i), "Tolkien");
    await user.click(screen.getByRole("button", { name: /buscar/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({ title: "Hobbit", author: "Tolkien" });
  });

  it("omite campos vacíos en el submit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<BookSearchForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: /buscar/i }));

    expect(onSubmit).toHaveBeenCalledWith({});
  });

  it("hidrata desde initialValues", () => {
    render(
      <BookSearchForm
        onSubmit={() => {}}
        initialValues={{ title: "Dune", category: "SciFi" }}
      />,
    );
    expect(screen.getByLabelText(/título/i)).toHaveValue("Dune");
    expect(screen.getByLabelText(/categoría/i)).toHaveValue("SciFi");
  });

  it("deshabilita el botón mientras se está buscando", () => {
    render(<BookSearchForm onSubmit={() => {}} isSearching />);
    expect(screen.getByRole("button", { name: /buscando/i })).toBeDisabled();
  });
});
