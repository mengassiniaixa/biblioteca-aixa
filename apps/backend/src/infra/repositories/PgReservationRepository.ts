import { Reservation, ReservationRepository } from "@mi-proyecto/domain";
import type { Pool } from "pg";

interface Row {
  id: string;
  book_id: string;
  user_id: string;
  reservation_date: Date;
  status: "PENDING" | "AVAILABLE" | "FULFILLED" | "CANCELLED";
}

function toEntity(row: Row): Reservation {
  return Reservation.reconstitute({
    id: row.id,
    bookId: row.book_id,
    userId: row.user_id,
    reservationDate: row.reservation_date,
    status: row.status,
  });
}

const SELECT_COLS = "id, book_id, user_id, reservation_date, status";

export class PgReservationRepository implements ReservationRepository {
  constructor(private readonly pool: Pool) {}

  async save(reservation: Reservation): Promise<void> {
    await this.pool.query(
      `INSERT INTO reservations (id, book_id, user_id, reservation_date, status)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         book_id = EXCLUDED.book_id,
         user_id = EXCLUDED.user_id,
         reservation_date = EXCLUDED.reservation_date,
         status = EXCLUDED.status`,
      [
        reservation.id,
        reservation.bookId,
        reservation.userId,
        reservation.reservationDate,
        reservation.status,
      ],
    );
  }

  async findById(id: string): Promise<Reservation | null> {
    const { rows } = await this.pool.query<Row>(
      `SELECT ${SELECT_COLS} FROM reservations WHERE id = $1`,
      [id],
    );
    return rows[0] ? toEntity(rows[0]) : null;
  }

  async findPendingByBook(bookId: string): Promise<Reservation[]> {
    const { rows } = await this.pool.query<Row>(
      `SELECT ${SELECT_COLS} FROM reservations
       WHERE book_id = $1 AND status = 'PENDING'
       ORDER BY reservation_date`,
      [bookId],
    );
    return rows.map(toEntity);
  }

  async findActiveByUser(userId: string): Promise<Reservation[]> {
    const { rows } = await this.pool.query<Row>(
      `SELECT ${SELECT_COLS} FROM reservations
       WHERE user_id = $1 AND status IN ('PENDING', 'AVAILABLE')`,
      [userId],
    );
    return rows.map(toEntity);
  }
}
