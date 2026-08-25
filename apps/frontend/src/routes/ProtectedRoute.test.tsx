import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { AuthProvider, AUTH_TOKEN_STORAGE_KEY } from "../auth/AuthContext";

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

function renderAt(pathname: string, storage: ReturnType<typeof fakeStorage>) {
  return render(
    <AuthProvider storage={storage}>
      <MemoryRouter initialEntries={[pathname]}>
        <Routes>
          <Route path="/login" element={<div>login page</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<div>home page</div>} />
          </Route>
          <Route
            element={<ProtectedRoute roles={["LIBRARIAN"]} />}
          >
            <Route path="/admin" element={<div>admin page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe("ProtectedRoute", () => {
  it("redirige a /login si no hay sesión", () => {
    renderAt("/", fakeStorage());
    expect(screen.getByText("login page")).toBeInTheDocument();
  });

  it("renderiza la ruta hija si hay sesión válida", () => {
    const token = makeJwt({ userId: "u1", role: "MEMBER" });
    renderAt("/", fakeStorage({ [AUTH_TOKEN_STORAGE_KEY]: token }));
    expect(screen.getByText("home page")).toBeInTheDocument();
  });

  it("redirige a / si el rol no está autorizado", () => {
    const token = makeJwt({ userId: "u1", role: "MEMBER" });
    renderAt("/admin", fakeStorage({ [AUTH_TOKEN_STORAGE_KEY]: token }));
    expect(screen.getByText("home page")).toBeInTheDocument();
  });

  it("renderiza la ruta protegida por rol si el rol coincide", () => {
    const token = makeJwt({ userId: "u1", role: "LIBRARIAN" });
    renderAt("/admin", fakeStorage({ [AUTH_TOKEN_STORAGE_KEY]: token }));
    expect(screen.getByText("admin page")).toBeInTheDocument();
  });
});
