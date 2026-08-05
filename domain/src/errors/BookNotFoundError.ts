import { DomainError } from "./DomainError";

export class BookNotFoundError extends DomainError {
  constructor(bookId: string) {
    super(`Book with id ${bookId} not found`);
    this.name = "BookNotFoundError";
  }
}
