import { env } from "../config/env";
import { ApiError } from "./ApiError";

export type TokenGetter = () => string | null;

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, unknown>;
  signal?: AbortSignal;
}

export interface ApiClient {
  request<T>(path: string, options?: RequestOptions): Promise<T>;
}

export function createApiClient(
  getToken: TokenGetter,
  baseUrl: string = env.apiBaseUrl,
): ApiClient {
  return {
    async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
      const url = new URL(path, ensureTrailingSlash(baseUrl));
      if (options.query) {
        for (const [key, value] of Object.entries(options.query)) {
          if (value === undefined || value === null || value === "") continue;
          url.searchParams.set(key, String(value));
        }
      }

      const headers: Record<string, string> = {
        Accept: "application/json",
      };
      if (options.body !== undefined) {
        headers["Content-Type"] = "application/json";
      }
      const token = getToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: options.method ?? "GET",
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: options.signal,
      });

      if (response.status === 204) {
        return undefined as T;
      }

      const raw = await response.text();
      const data = raw ? safeJsonParse(raw) : undefined;

      if (!response.ok) {
        throw new ApiError(
          response.status,
          typeof data?.error === "string" ? data.error : "UnknownError",
          typeof data?.message === "string" ? data.message : response.statusText,
        );
      }

      return data as T;
    },
  };
}

function ensureTrailingSlash(url: string): string {
  return url.endsWith("/") ? url : `${url}/`;
}

function safeJsonParse(raw: string): { error?: unknown; message?: unknown } | undefined {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}
