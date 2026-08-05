import { LoanBook } from "./LoanBook";
import { InMemoryBookRepository } from "./__fakes__/InMemoryBookRepository";
import { InMemoryLoanRepository } from "./__fakes__/InMemoryLoanRepository";
import { FakeClock } from "./__fakes__/FakeClock";
import { Book } from "../../entities/Book";
import { BookNotFoundError } from "../../errors/BookNotFoundError";
import { BookNotAvailableError } from "../../errors/BookNotAvailableError";
import { LoanLimitExceededError } from "../../errors/LoanLimitExceededError";
import { BookAlreadyLoanedError } from "../../errors/BookAlreadyLoanedError";

describe("LoanBook", () => {
  function setup() {
    const bookRepository = new InMemoryBookRepository();
    const loanRepository = new InMemoryLoanRepository();
    const clock = new FakeClock(new Date("2026-01-01"));
    const loanBook = new LoanBook(bookRepository, loanRepository, clock);
    return { bookRepository, loanRepository, clock, loanBook };
  }

  async function createBook(
    bookRepository: InMemoryBookRepository,
    totalCopies = 1,
  ) {
    const book = Book.create({
      isbn: "9783161484100",
      title: "Clean Code",
      author: "R. Martin",
      category: "Tech",
      totalCopies,
    });
    await bookRepository.save(book);
    return book;
  }

  it("presta un libro disponible y decrementa availableCopies", async () => {
    const { bookRepository, loanRepository, loanBook } = setup();
    const book = await createBook(bookRepository, 2);

    const result = await loanBook.execute({
      bookId: book.id,
      userId: "user-1",
    });

    expect(result.status).toBe("ACTIVE");

    const updatedBook = await bookRepository.findById(book.id);
    expect(updatedBook?.availableCopies).toBe(1);

    const savedLoan = await loanRepository.findById(result.id);
    expect(savedLoan).not.toBeNull();
  });

  it("calcula dueDate 14 días después de loanDate", async () => {
    const { bookRepository, loanBook } = setup();
    const book = await createBook(bookRepository);

    const result = await loanBook.execute({
      bookId: book.id,
      userId: "user-1",
    });

    expect(result.loanDate).toEqual(new Date("2026-01-01"));
    expect(result.dueDate).toEqual(new Date("2026-01-15"));
  });

  it("lanza BookNotFoundError si el libro no existe", async () => {
    const { loanBook } = setup();

    await expect(
      loanBook.execute({ bookId: "no-existe", userId: "user-1" }),
    ).rejects.toThrow(BookNotFoundError);
  });

  it("lanza BookNotAvailableError si no hay copias disponibles", async () => {
    const { bookRepository, loanBook } = setup();
    const book = await createBook(bookRepository, 1);

    await loanBook.execute({ bookId: book.id, userId: "user-1" });

    await expect(
      loanBook.execute({ bookId: book.id, userId: "user-2" }),
    ).rejects.toThrow(BookNotAvailableError);
  });

  it("lanza BookAlreadyLoanedError si el mismo usuario ya tiene un préstamo activo de ese libro", async () => {
    const { bookRepository, loanBook } = setup();
    const book = await createBook(bookRepository, 5);

    await loanBook.execute({ bookId: book.id, userId: "user-1" });

    await expect(
      loanBook.execute({ bookId: book.id, userId: "user-1" }),
    ).rejects.toThrow(BookAlreadyLoanedError);
  });

  it("lanza LoanLimitExceededError si el usuario ya tiene 3 préstamos activos", async () => {
    const { bookRepository, loanBook } = setup();
    const book1 = await createBook(bookRepository, 5);
    const book2 = Book.create({
      isbn: "9783161484200",
      title: "Book 2",
      author: "A",
      category: "C",
      totalCopies: 5,
    });
    const book3 = Book.create({
      isbn: "9783161484300",
      title: "Book 3",
      author: "A",
      category: "C",
      totalCopies: 5,
    });
    const book4 = Book.create({
      isbn: "9783161484400",
      title: "Book 4",
      author: "A",
      category: "C",
      totalCopies: 5,
    });
    await bookRepository.save(book2);
    await bookRepository.save(book3);
    await bookRepository.save(book4);

    await loanBook.execute({ bookId: book1.id, userId: "user-1" });
    await loanBook.execute({ bookId: book2.id, userId: "user-1" });
    await loanBook.execute({ bookId: book3.id, userId: "user-1" });

    await expect(
      loanBook.execute({ bookId: book4.id, userId: "user-1" }),
    ).rejects.toThrow(LoanLimitExceededError);
  });
});
