import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HomePage } from "./HomePage";
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

function mockFetchByUrl(handlers: Record<string, unknown>) {
  return vi.fn().mockImplementation((input: string | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    for (const [suffix, body] of Object.entries(handlers)) {
      if (url.endsWith(suffix)) {
        return Promise.resolve(jsonResponse(200, body));
      }
    }
    return Promise.resolve(jsonResponse(404, { error: "not-found" }));
  });
}

function renderPage(storage = fakeStorage()) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <AuthProvider storage={storage}>
        <ToastProvider>
          <ConfirmProvider>
            <MemoryRouter>
              <HomePage />
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

describe("HomePage", () => {
  it("MEMBER ve resumen de préstamos, reservas e historial", async () => {
    const token = makeJwt({ userId: "u1", role: "MEMBER" });
    vi.stubGlobal(
      "fetch",
      mockFetchByUrl({
        "/loans/mine": [
          {
            id: "l1",
            bookId: "b1",
            userId: "u1",
            loanDate: "2026-08-25T00:00:00.000Z",
            dueDate: "2026-12-01T00:00:00.000Z",
            status: "ACTIVE",
            book: { id: "b1", title: "Dune", author: "Herbert", isbn: "978-1" },
          },
        ],
        "/reservations/mine": [],
        "/loans/mine/history": [
          {
            id: "lh1",
            bookId: "b2",
            userId: "u1",
            loanDate: "2026-07-01T00:00:00.000Z",
            dueDate: "2026-07-15T00:00:00.000Z",
            returnDate: "2026-07-10T00:00:00.000Z",
            status: "RETURNED",
            book: {
              id: "b2",
              title: "Clean Code",
              author: "Martin",
              isbn: "978-2",
            },
          },
        ],
      }),
    );

    renderPage(fakeStorage({ [AUTH_TOKEN_STORAGE_KEY]: token }));

    await waitFor(() =>
      expect(screen.getByText("Clean Code")).toBeInTheDocument(),
    );
    expect(screen.getByText(/préstamos activos/i)).toBeInTheDocument();
    expect(screen.getByText(/reservas activas/i)).toBeInTheDocument();
    expect(screen.getByText(/ir a mi biblioteca/i)).toBeInTheDocument();
  });

  it("LIBRARIAN ve stat cards con los totales del backend", async () => {
    const token = makeJwt({ userId: "l1", role: "LIBRARIAN" });
    vi.stubGlobal(
      "fetch",
      mockFetchByUrl({
        "/stats/library": {
          totalBooks: 42,
          activeLoans: 7,
          overdueLoans: 3,
          totalMembers: 15,
        },
      }),
    );

    renderPage(fakeStorage({ [AUTH_TOKEN_STORAGE_KEY]: token }));

    await waitFor(() => expect(screen.getByText("42")).toBeInTheDocument());
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText(/revisar vencidos/i)).toBeInTheDocument();
    expect(screen.getByText(/requieren seguimiento/i)).toBeInTheDocument();
  });

  it("LIBRARIAN sin vencidos ve mensaje de todo al día", async () => {
    const token = makeJwt({ userId: "l1", role: "ADMIN" });
    vi.stubGlobal(
      "fetch",
      mockFetchByUrl({
        "/stats/library": {
          totalBooks: 10,
          activeLoans: 2,
          overdueLoans: 0,
          totalMembers: 5,
        },
      }),
    );

    renderPage(fakeStorage({ [AUTH_TOKEN_STORAGE_KEY]: token }));

    await waitFor(() =>
      expect(screen.getByText(/todo al día/i)).toBeInTheDocument(),
    );
  });
});
