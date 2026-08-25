import type { ApiClient } from "../client";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from "../types";

export const authEndpoints = (client: ApiClient) => ({
  login: (body: LoginRequest) =>
    client.request<LoginResponse>("auth/login", { method: "POST", body }),
  register: (body: RegisterRequest) =>
    client.request<RegisterResponse>("auth/register", { method: "POST", body }),
});
