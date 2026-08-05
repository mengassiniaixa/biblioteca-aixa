import { DomainError } from "./DomainError";

export class BookNotAvailableError extends DomainError {
  constructor(bookId: string) {
    super(`Book with id ${bookId} has no available copies`);
    this.name = "BookNotAvailableError";
  }
}
