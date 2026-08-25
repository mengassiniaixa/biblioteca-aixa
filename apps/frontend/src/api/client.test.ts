import { afterEach, describe, expect, it, vi } from "vitest";
import { createApiClient } from "./client";
import { ApiError } from "./ApiError";

const baseUrl = "http://api.test";

function mockFetchOnce(response: {
  status: number;
  body?: unknown;
  ok?: boolean;
}) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: response.ok ?? (response.status >= 200 && response.status < 300),
    status: response.status,
    statusText: response.status === 500 ? "Internal Server Error" : "",
    text: async () =>
      response.body === undefined ? "" : JSON.stringify(response.body),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("createApiClient", () => {
  it("construye la URL con path relativo y query params no vacíos", async () => {
    const fetchMock = mockFetchOnce({ status: 200, body: [] });
    const client = createApiClient(() => null, baseUrl);

    await client.request("books", { query: { title: "clean", author: "" } });

    const [url] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("http://api.test/books?title=clean");
  });

  it("agrega Authorization Bearer cuando el token existe", async () => {
    const fetchMock = mockFetchOnce({ status: 200, body: { token: "t" } });
    const client = createApiClient(() => "abc123", baseUrl);

    await client.request("auth/login", {
      method: "POST",
      body: { email: "a@b.c", password: "x" },
    });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBe("Bearer abc123");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.body).toBe(JSON.stringify({ email: "a@b.c", password: "x" }));
  });

  it("no agrega Authorization si el token es null", async () => {
    const fetchMock = mockFetchOnce({ status: 200, body: [] });
    const client = createApiClient(() => null, baseUrl);

    await client.request("books");

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBeUndefined();
  });

  it("devuelve undefined en 204 sin parsear body", async () => {
    mockFetchOnce({ status: 204 });
    const client = createApiClient(() => null, baseUrl);

    const result = await client.request("books/1", { method: "DELETE" });

    expect(result).toBeUndefined();
  });

  it("lanza ApiError con status y message del backend en respuesta no-ok", async () => {
    mockFetchOnce({
      status: 401,
      body: { error: "InvalidCredentialsError", message: "Credenciales inválidas" },
    });
    const client = createApiClient(() => null, baseUrl);

    await expect(
      client.request("auth/login", {
        method: "POST",
        body: { email: "a", password: "b" },
      }),
    ).rejects.toMatchObject({
      name: "ApiError",
      status: 401,
      code: "InvalidCredentialsError",
      message: "Credenciales inválidas",
    });
  });

  it("ApiError es instanceof ApiError", async () => {
    mockFetchOnce({ status: 500, body: undefined });
    const client = createApiClient(() => null, baseUrl);

    await expect(client.request("x")).rejects.toBeInstanceOf(ApiError);
  });
});
