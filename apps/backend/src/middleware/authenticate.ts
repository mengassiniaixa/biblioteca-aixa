import { NextFunction, Request, Response } from "express";
import { InvalidCredentialsError, TokenService } from "@mi-proyecto/domain";
import { AuthenticatedRequest } from "../http/types";

export function authenticate(tokenService: TokenService) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return next(new InvalidCredentialsError());
    }

    const token = header.slice("Bearer ".length).trim();
    try {
      const payload = tokenService.verify(token);
      (req as AuthenticatedRequest).auth = payload;
      next();
    } catch {
      next(new InvalidCredentialsError());
    }
  };
}
