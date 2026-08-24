import { Router } from "express";
import { z } from "zod";
import { AuthenticateUser, RegisterUser } from "@mi-proyecto/domain";
import { asyncHandler } from "./asyncHandler";

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

interface Deps {
  registerUser: RegisterUser;
  authenticateUser: AuthenticateUser;
}

export function buildAuthRouter(deps: Deps): Router {
  const router = Router();

  router.post(
    "/register",
    asyncHandler(async (req, res) => {
      const input = registerSchema.parse(req.body);
      const result = await deps.registerUser.execute(input);
      res.status(201).json(result);
    }),
  );

  router.post(
    "/login",
    asyncHandler(async (req, res) => {
      const input = loginSchema.parse(req.body);
      const result = await deps.authenticateUser.execute(input);
      res.status(200).json(result);
    }),
  );

  return router;
}
