import { BookRepository } from "../../repositories/BookRepository";
import { LoanRepository } from "../../repositories/LoanRepository";
import { ReservationRepository } from "../../repositories/ReservationRepository";
import { Clock } from "../../services/Clock";
import { LoanNotFoundError } from "../../errors/LoanNotFoundError";
import { BookNotFoundError } from "../../errors/BookNotFoundError";

interface ReturnBookInput {
  loanId: string;
}

interface ReturnBookOutput {
  loanId: string;
  bookId: string;
  userId: string;
  returnDate: Date;
  status: string;
  reservationPromotedTo?: string;
}

export class ReturnBook {
  constructor(
    private loanRepository: LoanRepository,
    private bookRepository: BookRepository,
    private reservationRepository: ReservationRepository,
    private clock: Clock,
  ) {}

  async execute(input: ReturnBookInput): Promise<ReturnBookOutput> {
    const loan = await this.loanRepository.findById(input.loanId);
    if (!loan) {
      throw new LoanNotFoundError(input.loanId);
    }

    const book = await this.bookRepository.findById(loan.bookId);
    if (!book) {
      throw new BookNotFoundError(loan.bookId);
    }

    const now = this.clock.now();
    loan.markAsReturned(now);
    book.increaseAvailability();

    await this.loanRepository.save(loan);
    await this.bookRepository.save(book);

    const pending = await this.reservationRepository.findPendingByBook(book.id);
    const nextReservation = pending
      .slice()
      .sort(
        (a, b) => a.reservationDate.getTime() - b.reservationDate.getTime(),
      )[0];

    if (nextReservation) {
      nextReservation.markAsAvailable();
      await this.reservationRepository.save(nextReservation);
    }

    const returnDate = loan.returnDate ?? now;

    return {
      loanId: loan.id,
      bookId: loan.bookId,
      userId: loan.userId,
      returnDate,
      status: loan.status,
      ...(nextReservation && { reservationPromotedTo: nextReservation.id }),
    };
  }
}
