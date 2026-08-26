import { DomainError } from "./DomainError";

export class BookAlreadyExistsError extends DomainError {
  constructor(isbn: string) {
    super(`Book with ISBN ${isbn} already exists`);
    this.name = "BookAlreadyExistsError";
  }
}
