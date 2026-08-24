import { RequestHandler, Router } from "express";
import { z } from "zod";
import {
  CreateBook,
  DeleteBook,
  SearchBooks,
  UpdateBook,
} from "@mi-proyecto/domain";
import { asyncHandler } from "./asyncHandler";
import { AuthenticatedRequest } from "./types";

const createSchema = z.object({
  isbn: z.string().min(1),
  title: z.string().min(1),
  author: z.string().min(1),
  category: z.string().min(1),
  totalCopies: z.number().int().positive(),
});

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  author: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  totalCopies: z.number().int().positive().optional(),
});

const searchSchema = z.object({
  title: z.string().optional(),
  author: z.string().optional(),
  category: z.string().optional(),
});

interface Deps {
  createBook: CreateBook;
  updateBook: UpdateBook;
  deleteBook: DeleteBook;
  searchBooks: SearchBooks;
  authMiddleware: RequestHandler;
}

export function buildBooksRouter(deps: Deps): Router {
  const router = Router();

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const query = searchSchema.parse(req.query);
      const books = await deps.searchBooks.execute(query);
      res.json(books);
    }),
  );

  router.post(
    "/",
    deps.authMiddleware,
    asyncHandler(async (req, res) => {
      const auth = (req as AuthenticatedRequest).auth;
      const input = createSchema.parse(req.body);
      const book = await deps.createBook.execute({ ...input, actorId: auth.userId });
      res.status(201).json(book);
    }),
  );

  router.put(
    "/:id",
    deps.authMiddleware,
    asyncHandler(async (req, res) => {
      const auth = (req as AuthenticatedRequest).auth;
      const input = updateSchema.parse(req.body);
      const book = await deps.updateBook.execute({
        ...input,
        actorId: auth.userId,
        bookId: req.params.id,
      });
      res.json(book);
    }),
  );

  router.delete(
    "/:id",
    deps.authMiddleware,
    asyncHandler(async (req, res) => {
      const auth = (req as AuthenticatedRequest).auth;
      await deps.deleteBook.execute({
        actorId: auth.userId,
        bookId: req.params.id,
      });
      res.status(204).send();
    }),
  );

  return router;
}
