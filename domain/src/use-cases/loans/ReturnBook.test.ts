import { ReturnBook } from "./ReturnBook";
import { InMemoryBookRepository } from "./__fakes__/InMemoryBookRepository";
import { InMemoryLoanRepository } from "./__fakes__/InMemoryLoanRepository";
import { InMemoryReservationRepository } from "./__fakes__/InMemoryReservationRepository";
import { FakeClock } from "./__fakes__/FakeClock";
import { Book } from "../../entities/Book";
import { Loan } from "../../entities/Loan";
import { Reservation } from "../../entities/Reservation";
import { LoanNotFoundError } from "../../errors/LoanNotFoundError";
import { BookNotFoundError } from "../../errors/BookNotFoundError";

describe("ReturnBook", () => {
  function setup() {
    const bookRepository = new InMemoryBookRepository();
    const loanRepository = new InMemoryLoanRepository();
    const reservationRepository = new InMemoryReservationRepository();
    const clock = new FakeClock(new Date("2026-01-15"));
    const returnBook = new ReturnBook(
      loanRepository,
      bookRepository,
      reservationRepository,
      clock,
    );
    return {
      bookRepository,
      loanRepository,
      reservationRepository,
      clock,
      returnBook,
    };
  }

  async function createLoanedBook(
    bookRepository: InMemoryBookRepository,
    loanRepository: InMemoryLoanRepository,
    userId = "user-1",
  ) {
    const book = Book.create({
      isbn: "9783161484100",
      title: "Clean Code",
      author: "R. Martin",
      category: "Tech",
      totalCopies: 2,
    });
    book.decreaseAvailability();
    await bookRepository.save(book);

    const loan = Loan.create({
      bookId: book.id,
      userId,
      loanDate: new Date("2026-01-01"),
      dueDate: new Date("2026-01-15"),
    });
    await loanRepository.save(loan);

    return { book, loan };
  }

  it("marca el préstamo como RETURNED con returnDate = clock.now()", async () => {
    const { bookRepository, loanRepository, returnBook } = setup();
    const { loan } = await createLoanedBook(bookRepository, loanRepository);

    const result = await returnBook.execute({ loanId: loan.id });

    expect(result.status).toBe("RETURNED");
    expect(result.returnDate).toEqual(new Date("2026-01-15"));

    const saved = await loanRepository.findById(loan.id);
    expect(saved?.status).toBe("RETURNED");
    expect(saved?.returnDate).toEqual(new Date("2026-01-15"));
  });

  it("incrementa availableCopies del libro", async () => {
    const { bookRepository, loanRepository, returnBook } = setup();
    const { book, loan } = await createLoanedBook(
      bookRepository,
      loanRepository,
    );
    expect(book.availableCopies).toBe(1);

    await returnBook.execute({ loanId: loan.id });

    const updated = await bookRepository.findById(book.id);
    expect(updated?.availableCopies).toBe(2);
  });

  it("no promueve ninguna reserva si no hay reservas pendientes", async () => {
    const { bookRepository, loanRepository, returnBook } = setup();
    const { loan } = await createLoanedBook(bookRepository, loanRepository);

    const result = await returnBook.execute({ loanId: loan.id });

    expect(result.reservationPromotedTo).toBeUndefined();
  });

  it("promueve la reserva pendiente más antigua a AVAILABLE (FIFO)", async () => {
    const { bookRepository, loanRepository, reservationRepository, returnBook } =
      setup();
    const { book, loan } = await createLoanedBook(
      bookRepository,
      loanRepository,
    );

    const older = Reservation.reconstitute({
      id: "res-older",
      bookId: book.id,
      userId: "user-2",
      reservationDate: new Date("2026-01-05"),
      status: "PENDING",
    });
    const newer = Reservation.reconstitute({
      id: "res-newer",
      bookId: book.id,
      userId: "user-3",
      reservationDate: new Date("2026-01-10"),
      status: "PENDING",
    });
    await reservationRepository.save(newer);
    await reservationRepository.save(older);

    const result = await returnBook.execute({ loanId: loan.id });

    expect(result.reservationPromotedTo).toBe("res-older");

    const promoted = await reservationRepository.findById("res-older");
    expect(promoted?.status).toBe("AVAILABLE");

    const untouched = await reservationRepository.findById("res-newer");
    expect(untouched?.status).toBe("PENDING");
  });

  it("ignora reservas de otros libros al promover", async () => {
    const { bookRepository, loanRepository, reservationRepository, returnBook } =
      setup();
    const { loan } = await createLoanedBook(bookRepository, loanRepository);

    const otherBookReservation = Reservation.reconstitute({
      id: "res-other",
      bookId: "otro-libro",
      userId: "user-2",
      reservationDate: new Date("2026-01-05"),
      status: "PENDING",
    });
    await reservationRepository.save(otherBookReservation);

    const result = await returnBook.execute({ loanId: loan.id });

    expect(result.reservationPromotedTo).toBeUndefined();

    const untouched = await reservationRepository.findById("res-other");
    expect(untouched?.status).toBe("PENDING");
  });

  it("retorna loanId, bookId y userId del préstamo", async () => {
    const { bookRepository, loanRepository, returnBook } = setup();
    const { book, loan } = await createLoanedBook(
      bookRepository,
      loanRepository,
      "user-42",
    );

    const result = await returnBook.execute({ loanId: loan.id });

    expect(result.loanId).toBe(loan.id);
    expect(result.bookId).toBe(book.id);
    expect(result.userId).toBe("user-42");
  });

  it("lanza LoanNotFoundError si el préstamo no existe", async () => {
    const { returnBook } = setup();

    await expect(
      returnBook.execute({ loanId: "no-existe" }),
    ).rejects.toThrow(LoanNotFoundError);
  });

  it("lanza BookNotFoundError si el libro asociado al préstamo no existe", async () => {
    const { loanRepository, returnBook } = setup();
    const loan = Loan.create({
      bookId: "libro-fantasma",
      userId: "user-1",
      loanDate: new Date("2026-01-01"),
      dueDate: new Date("2026-01-15"),
    });
    await loanRepository.save(loan);

    await expect(
      returnBook.execute({ loanId: loan.id }),
    ).rejects.toThrow(BookNotFoundError);
  });
});
