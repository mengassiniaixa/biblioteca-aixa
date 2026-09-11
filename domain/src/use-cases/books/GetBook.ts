import { BookRepository } from "../../repositories/BookRepository";
import { BookNotFoundError } from "../../errors/BookNotFoundError";

interface GetBookInput {
  bookId: string;
}

interface GetBookOutput {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
}

export class GetBook {
  constructor(private bookRepository: BookRepository) {}

  async execute(input: GetBookInput): Promise<GetBookOutput> {
    const book = await this.bookRepository.findById(input.bookId);
    if (!book) {
      throw new BookNotFoundError(input.bookId);
    }
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
