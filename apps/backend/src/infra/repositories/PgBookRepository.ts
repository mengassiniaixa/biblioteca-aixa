import { Book, BookRepository, ISBN } from "@mi-proyecto/domain";
import type { Pool } from "pg";

interface Row {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  total_copies: number;
  available_copies: number;
}

function toEntity(row: Row): Book {
  return Book.reconstitute({
    id: row.id,
    isbn: ISBN.create(row.isbn),
    title: row.title,
    author: row.author,
    category: row.category,
    totalCopies: row.total_copies,
    availableCopies: row.available_copies,
  });
}

const SELECT_COLS =
  "id, isbn, title, author, category, total_copies, available_copies";

export class PgBookRepository implements BookRepository {
  constructor(private readonly pool: Pool) {}

  async save(book: Book): Promise<void> {
    await this.pool.query(
      `INSERT INTO books (id, isbn, title, author, category, total_copies, available_copies)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         isbn = EXCLUDED.isbn,
         title = EXCLUDED.title,
         author = EXCLUDED.author,
         category = EXCLUDED.category,
         total_copies = EXCLUDED.total_copies,
         available_copies = EXCLUDED.available_copies`,
      [
        book.id,
        book.isbn,
        book.title,
        book.author,
        book.category,
        book.totalCopies,
        book.availableCopies,
      ],
    );
  }

  async findById(id: string): Promise<Book | null> {
    const { rows } = await this.pool.query<Row>(
      `SELECT ${SELECT_COLS} FROM books WHERE id = $1`,
      [id],
    );
    return rows[0] ? toEntity(rows[0]) : null;
  }

  async findByIsbn(isbn: string): Promise<Book | null> {
    const normalized = isbn.replace(/-/g, "").trim();
    const { rows } = await this.pool.query<Row>(
      `SELECT ${SELECT_COLS} FROM books WHERE isbn = $1`,
      [normalized],
    );
    return rows[0] ? toEntity(rows[0]) : null;
  }

  async findAll(): Promise<Book[]> {
    const { rows } = await this.pool.query<Row>(
      `SELECT ${SELECT_COLS} FROM books ORDER BY title`,
    );
    return rows.map(toEntity);
  }

  async search(query: {
    title?: string;
    author?: string;
    category?: string;
  }): Promise<Book[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (query.title) {
      params.push(`%${query.title.toLowerCase()}%`);
      conditions.push(`LOWER(title) LIKE $${params.length}`);
    }
    if (query.author) {
      params.push(`%${query.author.toLowerCase()}%`);
      conditions.push(`LOWER(author) LIKE $${params.length}`);
    }
    if (query.category) {
      params.push(query.category.toLowerCase());
      conditions.push(`LOWER(category) = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const { rows } = await this.pool.query<Row>(
      `SELECT ${SELECT_COLS} FROM books ${where} ORDER BY title`,
      params,
    );
    return rows.map(toEntity);
  }

  async delete(id: string): Promise<void> {
    await this.pool.query("DELETE FROM books WHERE id = $1", [id]);
  }
}
