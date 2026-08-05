import { BookRepository } from "../../repositories/BookRepository";
import { UserRepository } from "../../repositories/UserRepository";
import { BookNotFoundError } from "../../errors/BookNotFoundError";
import { UserNotFoundError } from "../../errors/UserNotFoundError";
import { UnauthorizedError } from "../../errors/UnauthorizedError";
import { BookHasActiveLoansError } from "../../errors/BookHasActiveLoansError";

interface DeleteBookInput {
  actorId: string;
  bookId: string;
}

export class DeleteBook {
  constructor(
    private bookRepository: BookRepository,
    private userRepository: UserRepository,
  ) {}

  async execute(input: DeleteBookInput): Promise<void> {
    const actor = await this.userRepository.findById(input.actorId);
    if (!actor) {
      throw new UserNotFoundError(input.actorId);
    }
    if (!actor.isLibrarianOrAdmin()) {
      throw new UnauthorizedError("delete book");
    }

    const book = await this.bookRepository.findById(input.bookId);
    if (!book) {
      throw new BookNotFoundError(input.bookId);
    }

    if (book.hasLoansOut()) {
      throw new BookHasActiveLoansError(book.id);
    }

    await this.bookRepository.delete(book.id);
  }
}
