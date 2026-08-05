import { BookRepository } from "../../repositories/BookRepository";

interface SearchBooksInput {
  title?: string;
  author?: string;
  category?: string;
}

interface SearchBooksOutput {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
}

export class SearchBooks {
  constructor(private bookRepository: BookRepository) {}

  async execute(input: SearchBooksInput): Promise<SearchBooksOutput[]> {
    const hasFilter =
      input.title !== undefined ||
      input.author !== undefined ||
      input.category !== undefined;

    const books = hasFilter
      ? await this.bookRepository.search({
          ...(input.title !== undefined && { title: input.title }),
          ...(input.author !== undefined && { author: input.author }),
          ...(input.category !== undefined && { category: input.category }),
        })
      : await this.bookRepository.findAll();

    return books.map((book) => ({
      id: book.id,
      isbn: book.isbn,
      title: book.title,
      author: book.author,
      category: book.category,
      totalCopies: book.totalCopies,
      availableCopies: book.availableCopies,
    }));
  }
}
