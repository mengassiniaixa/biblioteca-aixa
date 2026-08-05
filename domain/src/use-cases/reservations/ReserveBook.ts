import { Reservation } from "../../entities/Reservation";
import { BookRepository } from "../../repositories/BookRepository";
import { ReservationRepository } from "../../repositories/ReservationRepository";
import { UserRepository } from "../../repositories/UserRepository";
import { BookNotFoundError } from "../../errors/BookNotFoundError";
import { UserNotFoundError } from "../../errors/UserNotFoundError";
import { ReservationAlreadyExistsError } from "../../errors/ReservationAlreadyExistsError";

interface ReserveBookInput {
  userId: string;
  bookId: string;
}

interface ReserveBookOutput {
  id: string;
  bookId: string;
  userId: string;
  reservationDate: Date;
  status: string;
}

export class ReserveBook {
  constructor(
    private reservationRepository: ReservationRepository,
    private bookRepository: BookRepository,
    private userRepository: UserRepository,
  ) {}

  async execute(input: ReserveBookInput): Promise<ReserveBookOutput> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new UserNotFoundError(input.userId);
    }

    const book = await this.bookRepository.findById(input.bookId);
    if (!book) {
      throw new BookNotFoundError(input.bookId);
    }

    const pending = await this.reservationRepository.findPendingByBook(book.id);
    const duplicate = pending.find((r) => r.userId === input.userId);
    if (duplicate) {
      throw new ReservationAlreadyExistsError(input.userId, input.bookId);
    }

    const reservation = Reservation.create({
      bookId: book.id,
      userId: user.id,
    });

    await this.reservationRepository.save(reservation);

    return {
      id: reservation.id,
      bookId: reservation.bookId,
      userId: reservation.userId,
      reservationDate: reservation.reservationDate,
      status: reservation.status,
    };
  }
}
