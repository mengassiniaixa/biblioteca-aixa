import { BookRepository } from "../../repositories/BookRepository";
import { UserRepository } from "../../repositories/UserRepository";
import { BookNotFoundError } from "../../errors/BookNotFoundError";
import { UserNotFoundError } from "../../errors/UserNotFoundError";
import { UnauthorizedError } from "../../errors/UnauthorizedError";

interface UpdateBookInput {
  actorId: string;
  bookId: string;
  title?: string;
  author?: string;
  category?: string;
  totalCopies?: number;
}

interface UpdateBookOutput {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
}

export class UpdateBook {
  constructor(
    private bookRepository: BookRepository,
    private userRepository: UserRepository,
  ) {}

  async execute(input: UpdateBookInput): Promise<UpdateBookOutput> {
    const actor = await this.userRepository.findById(input.actorId);
    if (!actor) {
      throw new UserNotFoundError(input.actorId);
    }
    if (!actor.isLibrarianOrAdmin()) {
      throw new UnauthorizedError("update book");
    }

    const book = await this.bookRepository.findById(input.bookId);
    if (!book) {
      throw new BookNotFoundError(input.bookId);
    }

    book.updateDetails({
      ...(input.title !== undefined && { title: input.title }),
      ...(input.author !== undefined && { author: input.author }),
      ...(input.category !== undefined && { category: input.category }),
    });

    if (input.totalCopies !== undefined) {
      book.updateTotalCopies(input.totalCopies);
    }

    await this.bookRepository.save(book);

    return {
      id: book.id,
      isbn: book.isbn,
      title: book.title,
      author: book.author,
      category: book.category,
      totalCopies: book.totalCopies,
      availableCopies: book.availableCopies,
    };
  }
}
