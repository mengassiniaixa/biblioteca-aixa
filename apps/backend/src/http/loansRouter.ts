import { RequestHandler, Router } from "express";
import { z } from "zod";
import {
  ListOverdueLoans,
  LoanBook,
  ReturnBook,
} from "@mi-proyecto/domain";
import { asyncHandler } from "./asyncHandler";
import { AuthenticatedRequest } from "./types";

const loanSchema = z.object({
  bookId: z.string().min(1),
});

interface Deps {
  loanBook: LoanBook;
  returnBook: ReturnBook;
  listOverdueLoans: ListOverdueLoans;
  authMiddleware: RequestHandler;
}

export function buildLoansRouter(deps: Deps): Router {
  const router = Router();

  router.post(
    "/",
    deps.authMiddleware,
    asyncHandler(async (req, res) => {
      const auth = (req as AuthenticatedRequest).auth;
      const { bookId } = loanSchema.parse(req.body);
      const loan = await deps.loanBook.execute({ userId: auth.userId, bookId });
      res.status(201).json(loan);
    }),
  );

  router.post(
    "/:id/return",
    deps.authMiddleware,
    asyncHandler(async (req, res) => {
      const result = await deps.returnBook.execute({ loanId: req.params.id });
      res.json(result);
    }),
  );

  router.get(
    "/overdue",
    deps.authMiddleware,
    asyncHandler(async (req, res) => {
      const auth = (req as AuthenticatedRequest).auth;
      const loans = await deps.listOverdueLoans.execute({ actorId: auth.userId });
      res.json(loans);
    }),
  );

  return router;
}
