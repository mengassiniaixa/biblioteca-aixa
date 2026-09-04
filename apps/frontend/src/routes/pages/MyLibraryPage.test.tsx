import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MyLibraryPage } from "./MyLibraryPage";
import { AuthProvider, AUTH_TOKEN_STORAGE_KEY } from "../../auth/AuthContext";
import { ConfirmProvider, ToastProvider } from "../../components/ui";
import type {
  Loan,
  LoanHistoryEntry,
  Reservation,
} from "../../api/types";

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

const activeLoans: Loan[] = [
  {
    id: "l1",
    bookId: "b1",
    userId: "u1",
    loanDate: "2026-08-25T00:00:00.000Z",
    dueDate: "2026-09-08T00:00:00.000Z",
    status: "ACTIVE",
    book: { id: "b1", title: "Dune", author: "Herbert", isbn: "978-1" },
  },
];

const activeReservations: Reservation[] = [
  {
    id: "r1",
    bookId: "b2",
    userId: "u1",
    reservationDate: "2026-08-30T00:00:00.000Z",
    status: "PENDING",
    book: {
      id: "b2",
      title: "Clean Code",
      author: "Martin",
      isbn: "978-2",
    },
  },
];

const history: LoanHistoryEntry[] = [
  {
    id: "l0",
    bookId: "b3",
    userId: "u1",
    loanDate: "2026-07-10T00:00:00.000Z",
    dueDate: "2026-07-24T00:00:00.000Z",
    returnDate: "2026-07-20T00:00:00.000Z",
    status: "RETURNED",
    book: { id: "b3", title: "El Hobbit", author: "Tolkien", isbn: "978-3" },
  },
];

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
              <MyLibraryPage />
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

describe("MyLibraryPage", () => {
  it("muestra las 3 secciones con datos del backend", async () => {
    const token = makeJwt({ userId: "u1", role: "MEMBER" });
    vi.stubGlobal(
      "fetch",
      mockFetchByUrl({
        "/loans/mine": activeLoans,
        "/loans/mine/history": history,
        "/reservations/mine": activeReservations,
      }),
    );

    renderPage(fakeStorage({ [AUTH_TOKEN_STORAGE_KEY]: token }));

    await waitFor(() => {
      expect(screen.getByText("Dune")).toBeInTheDocument();
      expect(screen.getByText("Clean Code")).toBeInTheDocument();
      expect(screen.getByText("El Hobbit")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("heading", { name: /préstamos activos/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /reservas activas/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /historial de préstamos/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/devuelto/i).length).toBeGreaterThan(0);
  });

  it("empty states cuando no hay datos", async () => {
    const token = makeJwt({ userId: "u1", role: "MEMBER" });
    vi.stubGlobal(
      "fetch",
      mockFetchByUrl({
        "/loans/mine": [],
        "/loans/mine/history": [],
        "/reservations/mine": [],
      }),
    );

    renderPage(fakeStorage({ [AUTH_TOKEN_STORAGE_KEY]: token }));

    await waitFor(() =>
      expect(
        screen.getByText(/no tenés préstamos activos/i),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByText(/no tenés reservas activas/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/todavía no tenés préstamos registrados/i),
    ).toBeInTheDocument();
  });

  it("devolver un préstamo dispara POST /loans/:id/return", async () => {
    const user = userEvent.setup();
    const token = makeJwt({ userId: "u1", role: "MEMBER" });

    const calls: string[] = [];
    const fetchMock = vi.fn().mockImplementation((input: string | URL, opts?: {
      method?: string;
    }) => {
      const url = typeof input === "string" ? input : input.toString();
      calls.push(`${opts?.method ?? "GET"} ${url}`);
      if (url.endsWith("/loans/mine"))
        return Promise.resolve(jsonResponse(200, activeLoans));
      if (url.endsWith("/loans/mine/history"))
        return Promise.resolve(jsonResponse(200, history));
      if (url.endsWith("/reservations/mine"))
        return Promise.resolve(jsonResponse(200, []));
      if (url.endsWith("/loans/l1/return"))
        return Promise.resolve(
          jsonResponse(200, {
            loanId: "l1",
            bookId: "b1",
            userId: "u1",
            returnDate: "2026-09-04T00:00:00.000Z",
            status: "RETURNED",
          }),
        );
      return Promise.resolve(jsonResponse(404, {}));
    });
    vi.stubGlobal("fetch", fetchMock);

    renderPage(fakeStorage({ [AUTH_TOKEN_STORAGE_KEY]: token }));

    await waitFor(() => expect(screen.getByText("Dune")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /devolver/i }));

    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /devolver/i }));

    await waitFor(() =>
      expect(
        calls.some((c) => c.startsWith("POST ") && c.endsWith("/loans/l1/return")),
      ).toBe(true),
    );
  });
});
