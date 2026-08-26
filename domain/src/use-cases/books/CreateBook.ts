import { Book } from "../../entities/Book";
import { ISBN } from "../../value-objects/ISBN";
import { BookRepository } from "../../repositories/BookRepository";
import { UserRepository } from "../../repositories/UserRepository";
import { BookAlreadyExistsError } from "../../errors/BookAlreadyExistsError";
import { UserNotFoundError } from "../../errors/UserNotFoundError";
import { UnauthorizedError } from "../../errors/UnauthorizedError";

interface CreateBookInput {
  actorId: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  totalCopies: number;
}

interface CreateBookOutput {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
}

export class CreateBook {
  constructor(
    private bookRepository: BookRepository,
    private userRepository: UserRepository,
  ) {}

  async execute(input: CreateBookInput): Promise<CreateBookOutput> {
    const actor = await this.userRepository.findById(input.actorId);
    if (!actor) {
      throw new UserNotFoundError(input.actorId);
    }
    if (!actor.isLibrarianOrAdmin()) {
      throw new UnauthorizedError("create book");
    }

    const normalizedIsbn = ISBN.create(input.isbn).value;
    const existing = await this.bookRepository.findByIsbn(normalizedIsbn);
    if (existing) {
      throw new BookAlreadyExistsError(normalizedIsbn);
    }

    const book = Book.create({
      isbn: input.isbn,
      title: input.title,
      author: input.author,
      category: input.category,
      totalCopies: input.totalCopies,
    });

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
