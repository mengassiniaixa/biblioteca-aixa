import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, renderHook, screen } from "@testing-library/react";
import { AuthProvider, useAuth, AUTH_TOKEN_STORAGE_KEY } from "./AuthContext";

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
    _snapshot: () => Object.fromEntries(map),
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("useAuth", () => {
  it("lanza error si se usa fuera de AuthProvider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow(
      /debe usarse dentro de un <AuthProvider/,
    );
    spy.mockRestore();
  });

  it("hidrata el token desde el storage al montar", () => {
    const token = makeJwt({ userId: "u1", role: "MEMBER" });
    const storage = fakeStorage({ [AUTH_TOKEN_STORAGE_KEY]: token });

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <AuthProvider storage={storage}>{children}</AuthProvider>
      ),
    });

    expect(result.current.token).toBe(token);
    expect(result.current.user).toEqual({ userId: "u1", role: "MEMBER" });
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("login guarda el token, lo persiste y setea el usuario", async () => {
    const token = makeJwt({ userId: "u2", role: "LIBRARIAN" });
    const storage = fakeStorage();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () => JSON.stringify({ token }),
      }),
    );

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <AuthProvider storage={storage}>{children}</AuthProvider>
      ),
    });

    await act(async () => {
      await result.current.login("a@b.c", "secret");
    });

    expect(result.current.token).toBe(token);
    expect(result.current.user).toEqual({ userId: "u2", role: "LIBRARIAN" });
    expect(storage._snapshot()[AUTH_TOKEN_STORAGE_KEY]).toBe(token);
  });

  it("logout limpia el token y el storage", () => {
    const token = makeJwt({ userId: "u1", role: "MEMBER" });
    const storage = fakeStorage({ [AUTH_TOKEN_STORAGE_KEY]: token });

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <AuthProvider storage={storage}>{children}</AuthProvider>
      ),
    });

    act(() => {
      result.current.logout();
    });

    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(storage._snapshot()[AUTH_TOKEN_STORAGE_KEY]).toBeUndefined();
  });

  it("expone el AuthProvider como componente que renderiza hijos", () => {
    render(
      <AuthProvider storage={fakeStorage()}>
        <span>hola</span>
      </AuthProvider>,
    );
    expect(screen.getByText("hola")).toBeInTheDocument();
  });
});
