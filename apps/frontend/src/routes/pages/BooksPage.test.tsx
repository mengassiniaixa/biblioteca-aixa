import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BooksPage } from "./BooksPage";
import { AuthProvider, AUTH_TOKEN_STORAGE_KEY } from "../../auth/AuthContext";
import type { Book } from "../../api/types";

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

const sample: Book[] = [
  {
    id: "b1",
    isbn: "978-1",
    title: "Dune",
    author: "Herbert",
    category: "SciFi",
    totalCopies: 3,
    availableCopies: 2,
  },
];

function renderPage(storage = fakeStorage()) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <AuthProvider storage={storage}>
        <MemoryRouter>
          <BooksPage />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("BooksPage", () => {
  it("lista los libros que devuelve el backend (público, sin token)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, sample));
    vi.stubGlobal("fetch", fetchMock);

    renderPage();

    await waitFor(() =>
      expect(screen.getByText("Dune")).toBeInTheDocument(),
    );

    // primera llamada = GET /books sin Authorization
    const firstCall = fetchMock.mock.calls[0];
    const req = firstCall[1] as { headers: Record<string, string> };
    expect(req.headers.Authorization).toBeUndefined();
  });

  it("no muestra acciones de librarian a un MEMBER", async () => {
    const token = makeJwt({ userId: "u1", role: "MEMBER" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, sample)));

    renderPage(fakeStorage({ [AUTH_TOKEN_STORAGE_KEY]: token }));

    await waitFor(() => expect(screen.getByText("Dune")).toBeInTheDocument());
    expect(
      screen.queryByRole("button", { name: /nuevo libro/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^editar$/i }),
    ).not.toBeInTheDocument();
  });

  it("un LIBRARIAN puede crear un libro y refetch de la lista", async () => {
    const user = userEvent.setup();
    const token = makeJwt({ userId: "u1", role: "LIBRARIAN" });
    const nuevo: Book = {
      id: "b2",
      isbn: "978-9",
      title: "Nuevo",
      author: "Autor",
      category: "Cat",
      totalCopies: 5,
      availableCopies: 5,
    };

    const responses: Array<() => ReturnType<typeof jsonResponse>> = [
      () => jsonResponse(200, sample), // initial GET
      () => jsonResponse(201, nuevo), // POST
      () => jsonResponse(200, [...sample, nuevo]), // refetch GET
    ];
    const fetchMock = vi.fn().mockImplementation(() => {
      const next = responses.shift();
      if (!next) throw new Error("unexpected fetch");
      return Promise.resolve(next());
    });
    vi.stubGlobal("fetch", fetchMock);

    renderPage(fakeStorage({ [AUTH_TOKEN_STORAGE_KEY]: token }));

    await waitFor(() => expect(screen.getByText("Dune")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /nuevo libro/i }));

    const form = screen.getByRole("heading", { name: /nuevo libro/i })
      .closest("form")!;
    const withinForm = within(form);
    await user.type(withinForm.getByLabelText(/isbn/i), "978-9");
    await user.type(withinForm.getByLabelText(/título/i), "Nuevo");
    await user.type(withinForm.getByLabelText(/autor/i), "Autor");
    await user.type(withinForm.getByLabelText(/categoría/i), "Cat");
    await user.clear(withinForm.getByLabelText(/copias totales/i));
    await user.type(withinForm.getByLabelText(/copias totales/i), "5");
    await user.click(
      withinForm.getByRole("button", { name: /crear libro/i }),
    );

    await waitFor(() => expect(screen.getByText("Nuevo")).toBeInTheDocument());

    // verifico que el POST llevó Authorization
    const postCall = fetchMock.mock.calls[1];
    expect(postCall[1].method).toBe("POST");
    expect(postCall[1].headers.Authorization).toBe(`Bearer ${token}`);
  });
});
