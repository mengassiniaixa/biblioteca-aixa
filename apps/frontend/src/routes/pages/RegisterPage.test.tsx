import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { RegisterPage } from "./RegisterPage";
import { AuthProvider, AUTH_TOKEN_STORAGE_KEY } from "../../auth/AuthContext";

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
  initialEntries = ["/register"],
}: {
  storage: ReturnType<typeof fakeStorage>;
  initialEntries?: string[];
}) {
  return render(
    <AuthProvider storage={storage}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/books" element={<div>books page</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("RegisterPage", () => {
  it("registra, auto-loguea y redirige a /books", async () => {
    const user = userEvent.setup();
    const token = makeJwt({ userId: "u1", role: "MEMBER" });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        statusText: "Created",
        text: async () =>
          JSON.stringify({
            id: "u1",
            name: "Aixa",
            email: "a@b.c",
            role: "MEMBER",
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () => JSON.stringify({ token }),
      });
    vi.stubGlobal("fetch", fetchMock);

    renderApp({ storage: fakeStorage() });

    await user.type(screen.getByLabelText(/nombre/i), "Aixa");
    await user.type(screen.getByLabelText(/email/i), "a@b.c");
    await user.type(screen.getByLabelText(/contraseña/i), "secret1");
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    await waitFor(() =>
      expect(screen.getByText("books page")).toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [registerUrl, registerInit] = fetchMock.mock.calls[0] as [
      URL,
      RequestInit,
    ];
    expect(String(registerUrl)).toContain("auth/register");
    expect(registerInit.method).toBe("POST");
    const [loginUrl] = fetchMock.mock.calls[1] as [URL, RequestInit];
    expect(String(loginUrl)).toContain("auth/login");
  });

  it("muestra 'Ese email ya está registrado' cuando el backend responde 409", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 409,
        statusText: "Conflict",
        text: async () =>
          JSON.stringify({ error: "UserAlreadyExistsError", message: "dup" }),
      }),
    );

    renderApp({ storage: fakeStorage() });

    await user.type(screen.getByLabelText(/nombre/i), "Aixa");
    await user.type(screen.getByLabelText(/email/i), "a@b.c");
    await user.type(screen.getByLabelText(/contraseña/i), "secret1");
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Ese email ya está registrado",
      ),
    );
    expect(screen.queryByText("books page")).not.toBeInTheDocument();
  });

  it("redirige a /books si ya hay sesión activa", () => {
    const token = makeJwt({ userId: "u1", role: "MEMBER" });
    renderApp({
      storage: fakeStorage({ [AUTH_TOKEN_STORAGE_KEY]: token }),
    });
    expect(screen.getByText("books page")).toBeInTheDocument();
  });
});
