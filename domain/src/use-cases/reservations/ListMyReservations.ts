import { ReservationRepository } from "../../repositories/ReservationRepository";
import { BookRepository } from "../../repositories/BookRepository";

interface ListMyReservationsInput {
  userId: string;
}

interface MyReservationOutput {
  id: string;
  bookId: string;
  userId: string;
  reservationDate: Date;
  status: string;
  book: {
    id: string;
    title: string;
    author: string;
    isbn: string;
  };
}

export class ListMyReservations {
  constructor(
    private reservationRepository: ReservationRepository,
    private bookRepository: BookRepository,
  ) {}

  async execute(input: ListMyReservationsInput): Promise<MyReservationOutput[]> {
    const reservations = await this.reservationRepository.findActiveByUser(
      input.userId,
    );

    const outputs: MyReservationOutput[] = [];
    for (const reservation of reservations) {
      const book = await this.bookRepository.findById(reservation.bookId);
      if (!book) continue;

      outputs.push({
        id: reservation.id,
        bookId: reservation.bookId,
        userId: reservation.userId,
        reservationDate: reservation.reservationDate,
        status: reservation.status,
        book: {
          id: book.id,
          title: book.title,
          author: book.author,
          isbn: book.isbn,
        },
      });
    }

    return outputs;
  }
}
