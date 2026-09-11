import { Book } from "../../../entities/Book";
import { BookRepository } from "../../../repositories/BookRepository";

export class InMemoryBookRepository implements BookRepository {
  private books: Book[] = [];

  async save(book: Book): Promise<void> {
    const index = this.books.findIndex((b) => b.id === book.id);
    if (index >= 0) {
      this.books[index] = book;
    } else {
      this.books.push(book);
    }
  }

  async findById(id: string): Promise<Book | null> {
    return this.books.find((b) => b.id === id) ?? null;
  }

  async findByIsbn(isbn: string): Promise<Book | null> {
    return this.books.find((b) => b.isbn === isbn) ?? null;
  }

  async findAll(): Promise<Book[]> {
    return [...this.books];
  }

  async search(): Promise<Book[]> {
    return [...this.books];
  }

  async delete(id: string): Promise<void> {
    this.books = this.books.filter((b) => b.id !== id);
  }

  async count(): Promise<number> {
    return this.books.length;
  }
}
