import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { BookCover } from "./BookCover";

describe("BookCover", () => {
  it("renderiza la imagen cuando hay src", () => {
    render(
      <BookCover
        src="https://covers.example.com/a.jpg"
        alt="Portada de A"
      />,
    );
    const img = screen.getByAltText("Portada de A") as HTMLImageElement;
    expect(img.src).toBe("https://covers.example.com/a.jpg");
  });

  it("muestra el placeholder cuando no hay src", () => {
    render(<BookCover alt="Portada" />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByTestId("book-cover")).toHaveAttribute("aria-hidden");
  });

  it("cae al placeholder cuando la imagen falla al cargar", () => {
    render(
      <BookCover src="https://covers.example.com/rota.jpg" alt="Rota" />,
    );
    const img = screen.getByAltText("Rota");
    fireEvent.error(img);
    expect(screen.queryByAltText("Rota")).not.toBeInTheDocument();
    expect(screen.getByTestId("book-cover")).toHaveAttribute("aria-hidden");
  });
});
