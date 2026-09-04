import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Topbar } from "./Topbar";
import { AuthProvider, AUTH_TOKEN_STORAGE_KEY } from "../../auth/AuthContext";

function fakeStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
    removeItem: (k: string) => {
      map.delete(k);
    },
  };
}

function makeJwt(payload: Record<string, unknown>): string {
  const enc = (s: string) =>
    Buffer.from(s)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  return `${enc(JSON.stringify({ alg: "HS256" }))}.${enc(JSON.stringify(payload))}.sig`;
}

function renderTopbar(storage: ReturnType<typeof fakeStorage>) {
  return render(
    <AuthProvider storage={storage}>
      <MemoryRouter>
        <Topbar />
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe("Topbar", () => {
  it("muestra Ingresar y Crear cuenta cuando no hay sesión", () => {
    renderTopbar(fakeStorage());
    expect(screen.getByRole("link", { name: /ingresar/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /crear cuenta/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /salir/i })).not.toBeInTheDocument();
  });

  it("solo muestra el link a Vencidos si el rol lo permite", () => {
    const token = makeJwt({ userId: "u1", role: "MEMBER" });
    renderTopbar(fakeStorage({ [AUTH_TOKEN_STORAGE_KEY]: token }));
    expect(screen.getByRole("link", { name: /libros/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /vencidos/i })).not.toBeInTheDocument();
  });

  it("muestra Mi biblioteca solo para MEMBER", () => {
    const memberToken = makeJwt({ userId: "u1", role: "MEMBER" });
    const { unmount } = renderTopbar(
      fakeStorage({ [AUTH_TOKEN_STORAGE_KEY]: memberToken }),
    );
    expect(
      screen.getByRole("link", { name: /mi biblioteca/i }),
    ).toBeInTheDocument();
    unmount();

    const librarianToken = makeJwt({ userId: "u2", role: "LIBRARIAN" });
    renderTopbar(fakeStorage({ [AUTH_TOKEN_STORAGE_KEY]: librarianToken }));
    expect(
      screen.queryByRole("link", { name: /mi biblioteca/i }),
    ).not.toBeInTheDocument();
  });

  it("muestra Vencidos y badge de rol para LIBRARIAN", () => {
    const token = makeJwt({ userId: "u1", role: "LIBRARIAN" });
    renderTopbar(fakeStorage({ [AUTH_TOKEN_STORAGE_KEY]: token }));
    expect(screen.getByRole("link", { name: /vencidos/i })).toBeInTheDocument();
    expect(screen.getByText("LIBRARIAN")).toBeInTheDocument();
  });

  it("Salir borra el token del storage", async () => {
    const token = makeJwt({ userId: "u1", role: "MEMBER" });
    const storage = fakeStorage({ [AUTH_TOKEN_STORAGE_KEY]: token });
    renderTopbar(storage);
    expect(storage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBe(token);
    await userEvent.click(screen.getByRole("button", { name: /salir/i }));
    expect(storage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull();
  });
});
