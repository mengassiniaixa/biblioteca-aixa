import { Book } from "../entities/Book";

export interface BookRepository {
  save(book: Book): Promise<void>;
  findById(id: string): Promise<Book | null>;
  findByIsbn(isbn: string): Promise<Book | null>;
  findAll(): Promise<Book[]>;
  search(query: {
    title?: string;
    author?: string;
    category?: string;
  }): Promise<Book[]>;
  delete(id: string): Promise<void>;
}
