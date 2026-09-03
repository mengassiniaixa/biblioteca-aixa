import { ListMyLoanHistory } from "./ListMyLoanHistory";
import { InMemoryLoanRepository } from "./__fakes__/InMemoryLoanRepository";
import { InMemoryBookRepository } from "./__fakes__/InMemoryBookRepository";
import { Loan } from "../../entities/Loan";
import { Book } from "../../entities/Book";
import { ISBN } from "../../value-objects/ISBN";

describe("ListMyLoanHistory", () => {
  function setup() {
    const loanRepository = new InMemoryLoanRepository();
    const bookRepository = new InMemoryBookRepository();
    const useCase = new ListMyLoanHistory(loanRepository, bookRepository);
    return { loanRepository, bookRepository, useCase };
  }

  async function createBook(
    bookRepository: InMemoryBookRepository,
    overrides: Partial<{ id: string; title: string; isbn: string }> = {},
  ) {
    const book = Book.reconstitute({
      id: overrides.id ?? "book-1",
      isbn: ISBN.create(overrides.isbn ?? "9780553380163"),
      title: overrides.title ?? "Dune",
      author: "Herbert",
      category: "SciFi",
      totalCopies: 3,
      availableCopies: 3,
    });
    await bookRepository.save(book);
    return book;
  }

  async function createLoan(
    loanRepository: InMemoryLoanRepository,
    overrides: Partial<{
      bookId: string;
      userId: string;
      loanDate: Date;
      dueDate: Date;
      markReturned: boolean;
      returnDate: Date;
    }> = {},
  ) {
    const loanDate = overrides.loanDate ?? new Date("2026-01-01");
    const defaultDue = new Date(loanDate.getTime() + 14 * 24 * 60 * 60 * 1000);
    const loan = Loan.create({
      bookId: overrides.bookId ?? "book-1",
      userId: overrides.userId ?? "user-1",
      loanDate,
      dueDate: overrides.dueDate ?? defaultDue,
    });
    if (overrides.markReturned) {
      loan.markAsReturned(overrides.returnDate ?? new Date("2026-01-10"));
    }
    await loanRepository.save(loan);
    return loan;
  }

  it("incluye activos y devueltos del usuario", async () => {
    const { loanRepository, bookRepository, useCase } = setup();
    await createBook(bookRepository, { id: "book-a" });
    await createBook(bookRepository, { id: "book-b", isbn: "9780618640157" });
    await createLoan(loanRepository, {
      userId: "user-1",
      bookId: "book-a",
      loanDate: new Date("2026-01-01"),
      markReturned: true,
      returnDate: new Date("2026-01-10"),
    });
    await createLoan(loanRepository, {
      userId: "user-1",
      bookId: "book-b",
      loanDate: new Date("2026-02-01"),
    });

    const result = await useCase.execute({ userId: "user-1" });

    expect(result).toHaveLength(2);
    expect(result.map((r) => r.status)).toEqual(["ACTIVE", "RETURNED"]);
  });

  it("ordena por loanDate descendente (más reciente primero)", async () => {
    const { loanRepository, bookRepository, useCase } = setup();
    await createBook(bookRepository, { id: "book-a" });
    await createBook(bookRepository, { id: "book-b", isbn: "9780618640157" });
    await createBook(bookRepository, { id: "book-c", isbn: "9780132350884" });
    await createLoan(loanRepository, {
      userId: "user-1",
      bookId: "book-a",
      loanDate: new Date("2026-01-01"),
      markReturned: true,
    });
    await createLoan(loanRepository, {
      userId: "user-1",
      bookId: "book-c",
      loanDate: new Date("2026-03-01"),
    });
    await createLoan(loanRepository, {
      userId: "user-1",
      bookId: "book-b",
      loanDate: new Date("2026-02-01"),
      markReturned: true,
    });

    const result = await useCase.execute({ userId: "user-1" });

    expect(result.map((r) => r.bookId)).toEqual(["book-c", "book-b", "book-a"]);
  });

  it("expone returnDate cuando el préstamo fue devuelto", async () => {
    const { loanRepository, bookRepository, useCase } = setup();
    await createBook(bookRepository, { id: "book-a" });
    await createLoan(loanRepository, {
      userId: "user-1",
      bookId: "book-a",
      markReturned: true,
      returnDate: new Date("2026-01-10"),
    });

    const [result] = await useCase.execute({ userId: "user-1" });

    expect(result.returnDate).toEqual(new Date("2026-01-10"));
    expect(result.status).toBe("RETURNED");
  });

  it("returnDate es null si el préstamo sigue activo", async () => {
    const { loanRepository, bookRepository, useCase } = setup();
    await createBook(bookRepository, { id: "book-a" });
    await createLoan(loanRepository, { userId: "user-1", bookId: "book-a" });

    const [result] = await useCase.execute({ userId: "user-1" });

    expect(result.returnDate).toBeNull();
    expect(result.status).toBe("ACTIVE");
  });

  it("excluye los préstamos de otros usuarios", async () => {
    const { loanRepository, bookRepository, useCase } = setup();
    await createBook(bookRepository, { id: "book-a" });
    await createBook(bookRepository, { id: "book-b", isbn: "9780618640157" });
    await createLoan(loanRepository, { userId: "user-1", bookId: "book-a" });
    await createLoan(loanRepository, { userId: "user-2", bookId: "book-b" });

    const result = await useCase.execute({ userId: "user-1" });

    expect(result).toHaveLength(1);
    expect(result[0].bookId).toBe("book-a");
  });

  it("filtra silenciosamente los préstamos cuyo book fue eliminado", async () => {
    const { loanRepository, bookRepository, useCase } = setup();
    await createBook(bookRepository, { id: "book-a" });
    await createLoan(loanRepository, { userId: "user-1", bookId: "book-a" });
    await createLoan(loanRepository, {
      userId: "user-1",
      bookId: "book-fantasma",
    });

    const result = await useCase.execute({ userId: "user-1" });

    expect(result).toHaveLength(1);
    expect(result[0].bookId).toBe("book-a");
  });

  it("retorna array vacío si el usuario no tiene préstamos", async () => {
    const { useCase } = setup();

    const result = await useCase.execute({ userId: "user-sin-loans" });

    expect(result).toEqual([]);
  });
});
