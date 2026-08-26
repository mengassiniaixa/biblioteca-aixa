import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./LoginForm";

describe("LoginForm", () => {
  it("renderiza los campos y el botón", () => {
    render(<LoginForm onSubmit={() => {}} />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ingresar/i })).toBeEnabled();
  });

  it("dispara onSubmit con los valores tipeados", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<LoginForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/email/i), "  a@b.c  ");
    await user.type(screen.getByLabelText(/contraseña/i), "secret");
    await user.click(screen.getByRole("button", { name: /ingresar/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      email: "a@b.c",
      password: "secret",
    });
  });

  it("deshabilita inputs y muestra estado mientras envía", () => {
    render(<LoginForm onSubmit={() => {}} isSubmitting />);
    expect(screen.getByLabelText(/email/i)).toBeDisabled();
    expect(screen.getByLabelText(/contraseña/i)).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /ingresando/i }),
    ).toBeDisabled();
  });

  it("muestra el mensaje de error si se recibe", () => {
    render(
      <LoginForm onSubmit={() => {}} errorMessage="Credenciales inválidas" />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Credenciales inválidas");
  });
});
