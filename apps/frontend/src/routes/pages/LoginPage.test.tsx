import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LoginPage } from "./LoginPage";
import { AuthProvider, AUTH_TOKEN_STORAGE_KEY } from "../../auth/AuthContext";
import { ProtectedRoute } from "../ProtectedRoute";

function makeJwt(payload: Record<string, unknown>): string {
  const enc = (s: string) =>
    Buffer.from(s)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  return `${enc(JSON.stringify({ alg: "HS256" }))}.${enc(JSON.stringify(payload))}.sig`;
}

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

function renderApp({
  storage,
  initialEntries = ["/login"],
}: {
  storage: ReturnType<typeof fakeStorage>;
  initialEntries?: string[];
}) {
  return render(
    <AuthProvider storage={storage}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<div>home page</div>} />
            <Route path="/books" element={<div>books page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("LoginPage", () => {
  it("navega al home tras un login exitoso", async () => {
    const user = userEvent.setup();
    const token = makeJwt({ userId: "u1", role: "MEMBER" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () => JSON.stringify({ token }),
      }),
    );

    renderApp({ storage: fakeStorage() });

    await user.type(screen.getByLabelText(/email/i), "a@b.c");
    await user.type(screen.getByLabelText(/contraseña/i), "secret");
    await user.click(screen.getByRole("button", { name: /ingresar/i }));

    await waitFor(() =>
      expect(screen.getByText("home page")).toBeInTheDocument(),
    );
  });

  it("muestra 'Credenciales inválidas' cuando el backend responde 401", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: async () =>
          JSON.stringify({ error: "InvalidCredentialsError", message: "invalid" }),
      }),
    );

    renderApp({ storage: fakeStorage() });

    await user.type(screen.getByLabelText(/email/i), "a@b.c");
    await user.type(screen.getByLabelText(/contraseña/i), "wrong");
    await user.click(screen.getByRole("button", { name: /ingresar/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Credenciales inválidas",
      ),
    );
    expect(screen.queryByText("home page")).not.toBeInTheDocument();
  });

  it("redirige al home si ya hay sesión activa", () => {
    const token = makeJwt({ userId: "u1", role: "MEMBER" });
    renderApp({
      storage: fakeStorage({ [AUTH_TOKEN_STORAGE_KEY]: token }),
    });
    expect(screen.getByText("home page")).toBeInTheDocument();
  });

  it("respeta la ruta original tras login vía ProtectedRoute", async () => {
    const user = userEvent.setup();
    const token = makeJwt({ userId: "u1", role: "MEMBER" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () => JSON.stringify({ token }),
      }),
    );

    renderApp({ storage: fakeStorage(), initialEntries: ["/books"] });

    await user.type(screen.getByLabelText(/email/i), "a@b.c");
    await user.type(screen.getByLabelText(/contraseña/i), "secret");
    await user.click(screen.getByRole("button", { name: /ingresar/i }));

    await waitFor(() =>
      expect(screen.getByText("books page")).toBeInTheDocument(),
    );
  });
});
