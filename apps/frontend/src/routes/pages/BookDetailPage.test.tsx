import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BookDetailPage } from "./BookDetailPage";
import { AuthProvider, AUTH_TOKEN_STORAGE_KEY } from "../../auth/AuthContext";
import { ToastProvider, ConfirmProvider } from "../../components/ui";

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

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: "",
    text: async () => JSON.stringify(body),
  };
}

function mockFetchByUrl(handlers: Record<string, unknown | { status: number; body: unknown }>) {
  return vi.fn().mockImplementation((input: string | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    for (const [suffix, response] of Object.entries(handlers)) {
      if (url.endsWith(suffix)) {
        const isEnvelope =
          typeof response === "object" &&
          response !== null &&
          "status" in response &&
          "body" in response;
        if (isEnvelope) {
          const env = response as { status: number; body: unknown };
          return Promise.resolve(jsonResponse(env.status, env.body));
        }
        return Promise.resolve(jsonResponse(200, response));
      }
    }
    return Promise.resolve(jsonResponse(404, { error: "not-found" }));
  });
}

function renderAt(path: string, storage = fakeStorage()) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <AuthProvider storage={storage}>
        <ToastProvider>
          <ConfirmProvider>
            <MemoryRouter initialEntries={[path]}>
              <Routes>
                <Route path="/books/:id" element={<BookDetailPage />} />
              </Routes>
            </MemoryRouter>
          </ConfirmProvider>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("BookDetailPage", () => {
  it("renderiza los detalles del libro", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchByUrl({
        "/books/b1": {
          id: "b1",
          isbn: "9780441172719",
          title: "Dune",
          author: "Frank Herbert",
          category: "SciFi",
          totalCopies: 3,
          availableCopies: 2,
        },
      }),
    );

    renderAt("/books/b1");

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Dune" }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText(/por Frank Herbert/i)).toBeInTheDocument();
    expect(screen.getByText("9780441172719")).toBeInTheDocument();
    expect(
      screen.getByText("Disponible", { selector: "span" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/iniciá sesión/i)).toBeInTheDocument();
  });

  it("muestra el CTA MEMBER cuando el rol es MEMBER y el libro tiene copias", async () => {
    const token = makeJwt({ userId: "u1", role: "MEMBER" });
    vi.stubGlobal(
      "fetch",
      mockFetchByUrl({
        "/books/b1": {
          id: "b1",
          isbn: "9780441172719",
          title: "Dune",
          author: "Frank Herbert",
          category: "SciFi",
          totalCopies: 3,
          availableCopies: 2,
        },
        "/loans/mine": [],
        "/reservations/mine": [],
      }),
    );

    renderAt("/books/b1", fakeStorage({ [AUTH_TOKEN_STORAGE_KEY]: token }));

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /^prestar$/i }),
      ).toBeInTheDocument(),
    );
  });

  it("muestra estado 404 si el libro no existe", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchByUrl({
        "/books/no-existe": { status: 404, body: { error: "NotFound" } },
      }),
    );

    renderAt("/books/no-existe");

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /no encontramos ese libro/i }),
      ).toBeInTheDocument(),
    );
  });
});
