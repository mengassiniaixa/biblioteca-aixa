import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Hello } from "./Hello";

describe("Hello", () => {
  it("saluda con el nombre recibido", () => {
    render(<Hello name="biblioteca" />);
    expect(
      screen.getByRole("heading", { name: "Hola, biblioteca" }),
    ).toBeInTheDocument();
  });
});
