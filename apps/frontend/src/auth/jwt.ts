import type { Role } from "../api/types";

export interface AuthUser {
  userId: string;
  role: Role;
}

export function decodeAuthUser(token: string): AuthUser | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(parts[1])) as {
      userId?: unknown;
      role?: unknown;
      exp?: unknown;
    };

    if (typeof payload.exp === "number" && payload.exp * 1000 < Date.now()) {
      return null;
    }

    if (typeof payload.userId !== "string") return null;
    if (
      payload.role !== "MEMBER" &&
      payload.role !== "LIBRARIAN" &&
      payload.role !== "ADMIN"
    ) {
      return null;
    }

    return { userId: payload.userId, role: payload.role };
  } catch {
    return null;
  }
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const missing = padded.length % 4;
  const base64 = missing ? padded + "=".repeat(4 - missing) : padded;
  return typeof atob === "function"
    ? atob(base64)
    : Buffer.from(base64, "base64").toString("binary");
}
