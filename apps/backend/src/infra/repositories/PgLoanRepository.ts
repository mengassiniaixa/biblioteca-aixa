import { Loan, LoanRepository } from "@mi-proyecto/domain";
import type { Pool } from "pg";

interface Row {
  id: string;
  book_id: string;
  user_id: string;
  loan_date: Date;
  due_date: Date;
  return_date: Date | null;
  status: "ACTIVE" | "RETURNED" | "OVERDUE";
}

function toEntity(row: Row): Loan {
  return Loan.reconstitute({
    id: row.id,
    bookId: row.book_id,
    userId: row.user_id,
    loanDate: row.loan_date,
    dueDate: row.due_date,
    returnDate: row.return_date ?? undefined,
    status: row.status,
  });
}

const SELECT_COLS =
  "id, book_id, user_id, loan_date, due_date, return_date, status";

export class PgLoanRepository implements LoanRepository {
  constructor(private readonly pool: Pool) {}

  async save(loan: Loan): Promise<void> {
    await this.pool.query(
      `INSERT INTO loans (id, book_id, user_id, loan_date, due_date, return_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         book_id = EXCLUDED.book_id,
         user_id = EXCLUDED.user_id,
         loan_date = EXCLUDED.loan_date,
         due_date = EXCLUDED.due_date,
         return_date = EXCLUDED.return_date,
         status = EXCLUDED.status`,
      [
        loan.id,
        loan.bookId,
        loan.userId,
        loan.loanDate,
        loan.dueDate,
        loan.returnDate ?? null,
        loan.status,
      ],
    );
  }

  async findById(id: string): Promise<Loan | null> {
    const { rows } = await this.pool.query<Row>(
      `SELECT ${SELECT_COLS} FROM loans WHERE id = $1`,
      [id],
    );
    return rows[0] ? toEntity(rows[0]) : null;
  }

  async findActiveByUserAndBook(
    userId: string,
    bookId: string,
  ): Promise<Loan | null> {
    const { rows } = await this.pool.query<Row>(
      `SELECT ${SELECT_COLS} FROM loans
       WHERE user_id = $1 AND book_id = $2 AND status = 'ACTIVE'
       LIMIT 1`,
      [userId, bookId],
    );
    return rows[0] ? toEntity(rows[0]) : null;
  }

  async findActiveByUser(userId: string): Promise<Loan[]> {
    const { rows } = await this.pool.query<Row>(
      `SELECT ${SELECT_COLS} FROM loans WHERE user_id = $1 AND status = 'ACTIVE'`,
      [userId],
    );
    return rows.map(toEntity);
  }

  async findByUser(userId: string): Promise<Loan[]> {
    const { rows } = await this.pool.query<Row>(
      `SELECT ${SELECT_COLS} FROM loans WHERE user_id = $1 ORDER BY loan_date DESC`,
      [userId],
    );
    return rows.map(toEntity);
  }

  async findOverdue(today: Date): Promise<Loan[]> {
    const { rows } = await this.pool.query<Row>(
      `SELECT ${SELECT_COLS} FROM loans WHERE status = 'ACTIVE' AND due_date < $1`,
      [today],
    );
    return rows.map(toEntity);
  }
}
