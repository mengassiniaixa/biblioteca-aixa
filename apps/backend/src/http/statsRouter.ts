import { RequestHandler, Router } from "express";
import { GetLibraryStats } from "@mi-proyecto/domain";
import { asyncHandler } from "./asyncHandler";
import { AuthenticatedRequest } from "./types";

interface Deps {
  getLibraryStats: GetLibraryStats;
  authMiddleware: RequestHandler;
}

export function buildStatsRouter(deps: Deps): Router {
  const router = Router();

  router.get(
    "/library",
    deps.authMiddleware,
    asyncHandler(async (req, res) => {
      const auth = (req as AuthenticatedRequest).auth;
      const stats = await deps.getLibraryStats.execute({ actorId: auth.userId });
      res.json(stats);
    }),
  );

  return router;
}
