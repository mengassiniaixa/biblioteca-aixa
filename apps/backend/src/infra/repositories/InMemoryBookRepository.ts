import { Book, BookRepository } from "@mi-proyecto/domain";

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

  async findAll(): Promise<Book[]> {
    return [...this.books];
  }

  async search(query: {
    title?: string;
    author?: string;
    category?: string;
  }): Promise<Book[]> {
    return this.books.filter((b) => {
      if (
        query.title &&
        !b.title.toLowerCase().includes(query.title.toLowerCase())
      )
        return false;
      if (
        query.author &&
        !b.author.toLowerCase().includes(query.author.toLowerCase())
      )
        return false;
      if (query.category && b.category !== query.category) return false;
      return true;
    });
  }

  async delete(id: string): Promise<void> {
    this.books = this.books.filter((b) => b.id !== id);
  }
}
