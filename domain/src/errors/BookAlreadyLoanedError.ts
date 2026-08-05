import { DomainError } from "./DomainError";

export class BookAlreadyLoanedError extends DomainError {
  constructor(userId: string, bookId: string) {
    super(`User ${userId} already has an active loan for book ${bookId}`);
    this.name = "BookAlreadyLoanedError";
  }
}
