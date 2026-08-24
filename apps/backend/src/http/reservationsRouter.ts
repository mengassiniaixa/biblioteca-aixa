import { RequestHandler, Router } from "express";
import { z } from "zod";
import { CancelReservation, ReserveBook } from "@mi-proyecto/domain";
import { asyncHandler } from "./asyncHandler";
import { AuthenticatedRequest } from "./types";

const reserveSchema = z.object({
  bookId: z.string().min(1),
});

interface Deps {
  reserveBook: ReserveBook;
  cancelReservation: CancelReservation;
  authMiddleware: RequestHandler;
}

export function buildReservationsRouter(deps: Deps): Router {
  const router = Router();

  router.post(
    "/",
    deps.authMiddleware,
    asyncHandler(async (req, res) => {
      const auth = (req as AuthenticatedRequest).auth;
      const { bookId } = reserveSchema.parse(req.body);
      const reservation = await deps.reserveBook.execute({
        userId: auth.userId,
        bookId,
      });
      res.status(201).json(reservation);
    }),
  );

  router.post(
    "/:id/cancel",
    deps.authMiddleware,
    asyncHandler(async (req, res) => {
      const auth = (req as AuthenticatedRequest).auth;
      const result = await deps.cancelReservation.execute({
        actorId: auth.userId,
        reservationId: req.params.id,
      });
      res.json(result);
    }),
  );

  return router;
}
