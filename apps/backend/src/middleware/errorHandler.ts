import { ErrorRequestHandler } from "express";
import {
  BookAlreadyExistsError,
  BookAlreadyLoanedError,
  BookHasActiveLoansError,
  BookNotAvailableError,
  BookNotFoundError,
  DomainError,
  EmailAlreadyInUseError,
  InvalidCredentialsError,
  LoanLimitExceededError,
  LoanNotFoundError,
  ReservationAlreadyExistsError,
  ReservationNotFoundError,
  UnauthorizedError,
  UserNotFoundError,
} from "@mi-proyecto/domain";
import { ZodError } from "zod";

function statusFor(err: Error): number {
  if (err instanceof InvalidCredentialsError) return 401;
  if (err instanceof UnauthorizedError) return 403;
  if (
    err instanceof BookNotFoundError ||
    err instanceof UserNotFoundError ||
    err instanceof LoanNotFoundError ||
    err instanceof ReservationNotFoundError
  ) {
    return 404;
  }
  if (
    err instanceof EmailAlreadyInUseError ||
    err instanceof ReservationAlreadyExistsError ||
    err instanceof BookAlreadyExistsError ||
    err instanceof BookAlreadyLoanedError ||
    err instanceof BookNotAvailableError ||
    err instanceof LoanLimitExceededError ||
    err instanceof BookHasActiveLoansError
  ) {
    return 409;
  }
  if (err instanceof DomainError) return 400;
  return 500;
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "ValidationError",
      details: err.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    });
    return;
  }

  if (err instanceof Error) {
    const status = statusFor(err);
    res.status(status).json({
      error: err.name,
      message: err.message,
    });
    return;
  }

  res.status(500).json({ error: "InternalServerError", message: "Unknown" });
};
