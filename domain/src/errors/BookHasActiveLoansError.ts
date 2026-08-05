import { DomainError } from "./DomainError";

export class BookHasActiveLoansError extends DomainError {
  constructor(bookId: string) {
    super(`Book ${bookId} has active loans and cannot be deleted`);
    this.name = "BookHasActiveLoansError";
  }
}
