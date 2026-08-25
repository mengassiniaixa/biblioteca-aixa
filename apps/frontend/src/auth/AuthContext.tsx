import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createApi, type Api } from "../api";
import { decodeAuthUser, type AuthUser } from "./jwt";

const TOKEN_STORAGE_KEY = "biblioteca-aixa.token";

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  api: Api;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
  storage?: Pick<Storage, "getItem" | "setItem" | "removeItem">;
}

export function AuthProvider({ children, storage }: AuthProviderProps) {
  const store = storage ?? getDefaultStorage();

  const [token, setTokenState] = useState<string | null>(() =>
    store ? store.getItem(TOKEN_STORAGE_KEY) : null,
  );
  const tokenRef = useRef(token);
  tokenRef.current = token;

  const api = useMemo(() => createApi(() => tokenRef.current), []);

  const user = useMemo(() => (token ? decodeAuthUser(token) : null), [token]);

  const setToken = useCallback(
    (next: string | null) => {
      tokenRef.current = next;
      setTokenState(next);
      if (!store) return;
      if (next) store.setItem(TOKEN_STORAGE_KEY, next);
      else store.removeItem(TOKEN_STORAGE_KEY);
    },
    [store],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const { token: nextToken } = await api.auth.login({ email, password });
      setToken(nextToken);
    },
    [api, setToken],
  );

  const logout = useCallback(() => setToken(null), [setToken]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isAuthenticated: user !== null,
      api,
      login,
      logout,
    }),
    [token, user, api, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de un <AuthProvider />");
  }
  return ctx;
}

function getDefaultStorage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

export const AUTH_TOKEN_STORAGE_KEY = TOKEN_STORAGE_KEY;
