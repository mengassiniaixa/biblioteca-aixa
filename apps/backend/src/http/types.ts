import type { Request } from "express";

export interface AuthContext {
  userId: string;
  role: string;
}

export type AuthenticatedRequest = Request & { auth: AuthContext };
