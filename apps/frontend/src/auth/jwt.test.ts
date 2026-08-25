import { describe, expect, it } from "vitest";
import { decodeAuthUser } from "./jwt";

function makeJwt(payload: Record<string, unknown>): string {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64UrlEncode(JSON.stringify(payload));
  return `${header}.${body}.sig`;
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

describe("decodeAuthUser", () => {
  it("devuelve userId y role para un token válido", () => {
    const token = makeJwt({ userId: "u1", role: "MEMBER" });
    expect(decodeAuthUser(token)).toEqual({ userId: "u1", role: "MEMBER" });
  });

  it("devuelve null si el rol no es uno esperado", () => {
    const token = makeJwt({ userId: "u1", role: "OTRO" });
    expect(decodeAuthUser(token)).toBeNull();
  });

  it("devuelve null si el token está expirado", () => {
    const token = makeJwt({
      userId: "u1",
      role: "MEMBER",
      exp: Math.floor(Date.now() / 1000) - 60,
    });
    expect(decodeAuthUser(token)).toBeNull();
  });

  it("devuelve null si el token no tiene 3 partes", () => {
    expect(decodeAuthUser("invalido")).toBeNull();
  });
});
