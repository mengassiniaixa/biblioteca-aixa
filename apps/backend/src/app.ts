import express, { Express } from "express";
import { Container } from "./composition/container";
import { buildAuthRouter } from "./http/authRouter";
import { buildBooksRouter } from "./http/booksRouter";
import { buildLoansRouter } from "./http/loansRouter";
import { buildReservationsRouter } from "./http/reservationsRouter";
import { authenticate } from "./middleware/authenticate";
import { errorHandler } from "./middleware/errorHandler";

export function buildApp(container: Container): Express {
  const app = express();
  app.use(express.json());

  const allowedOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173";
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", allowedOrigin);
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });

  const authMiddleware = authenticate(container.tokenService);
  const { useCases } = container;

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use(
    "/auth",
    buildAuthRouter({
      registerUser: useCases.registerUser,
      authenticateUser: useCases.authenticateUser,
    }),
  );

  app.use(
    "/books",
    buildBooksRouter({
      createBook: useCases.createBook,
      updateBook: useCases.updateBook,
      deleteBook: useCases.deleteBook,
      searchBooks: useCases.searchBooks,
      authMiddleware,
    }),
  );

  app.use(
    "/loans",
    buildLoansRouter({
      loanBook: useCases.loanBook,
      returnBook: useCases.returnBook,
      listOverdueLoans: useCases.listOverdueLoans,
      authMiddleware,
    }),
  );

  app.use(
    "/reservations",
    buildReservationsRouter({
      reserveBook: useCases.reserveBook,
      cancelReservation: useCases.cancelReservation,
      authMiddleware,
    }),
  );

  app.use(errorHandler);

  return app;
}
