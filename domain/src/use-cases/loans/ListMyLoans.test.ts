import { ListMyLoans } from "./ListMyLoans";
import { InMemoryLoanRepository } from "./__fakes__/InMemoryLoanRepository";
import { InMemoryBookRepository } from "./__fakes__/InMemoryBookRepository";
import { Loan } from "../../entities/Loan";
import { Book } from "../../entities/Book";
import { ISBN } from "../../value-objects/ISBN";

describe("ListMyLoans", () => {
  function setup() {
    const loanRepository = new InMemoryLoanRepository();
    const bookRepository = new InMemoryBookRepository();
    const listMyLoans = new ListMyLoans(loanRepository, bookRepository);
    return { loanRepository, bookRepository, listMyLoans };
  }

  async function createBook(
    bookRepository: InMemoryBookRepository,
    overrides: Partial<{ id: string; title: string; author: string; isbn: string }> = {},
  ) {
    const book = Book.reconstitute({
      id: overrides.id ?? "book-1",
      isbn: ISBN.create(overrides.isbn ?? "9780553380163"),
      title: overrides.title ?? "Dune",
      author: overrides.author ?? "Herbert",
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
    const loan = Loan.create({
      bookId: overrides.bookId ?? "book-1",
      userId: overrides.userId ?? "user-1",
      loanDate: overrides.loanDate ?? new Date("2026-01-01"),
      dueDate: overrides.dueDate ?? new Date("2026-01-15"),
    });
    if (overrides.markReturned) {
      loan.markAsReturned(overrides.returnDate ?? new Date("2026-01-10"));
    }
    await loanRepository.save(loan);
    return loan;
  }

  it("retorna los préstamos activos del usuario enriquecidos con book", async () => {
    const { loanRepository, bookRepository, listMyLoans } = setup();
    await createBook(bookRepository, { id: "book-1", title: "Dune" });
    const own = await createLoan(loanRepository, { userId: "user-1" });

    const result = await listMyLoans.execute({ userId: "user-1" });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(own.id);
    expect(result[0].status).toBe("ACTIVE");
    expect(result[0].book.title).toBe("Dune");
  });

  it("excluye los préstamos de otros usuarios", async () => {
    const { loanRepository, bookRepository, listMyLoans } = setup();
    await createBook(bookRepository, { id: "book-1" });
    await createBook(bookRepository, {
      id: "book-otro",
      isbn: "9780618640157",
    });
    const own = await createLoan(loanRepository, { userId: "user-1" });
    await createLoan(loanRepository, {
      userId: "user-2",
      bookId: "book-otro",
    });

    const result = await listMyLoans.execute({ userId: "user-1" });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(own.id);
  });

  it("excluye los préstamos ya devueltos", async () => {
    const { loanRepository, bookRepository, listMyLoans } = setup();
    await createBook(bookRepository, { id: "book-devuelto", isbn: "9780618640157" });
    await createBook(bookRepository, { id: "book-activo", isbn: "9780132350884" });
    await createLoan(loanRepository, {
      userId: "user-1",
      bookId: "book-devuelto",
      markReturned: true,
    });
    const active = await createLoan(loanRepository, {
      userId: "user-1",
      bookId: "book-activo",
    });

    const result = await listMyLoans.execute({ userId: "user-1" });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(active.id);
  });

  it("filtra silenciosamente los préstamos cuyo book fue eliminado", async () => {
    const { loanRepository, bookRepository, listMyLoans } = setup();
    await createBook(bookRepository, { id: "book-1" });
    await createLoan(loanRepository, { userId: "user-1", bookId: "book-1" });
    await createLoan(loanRepository, {
      userId: "user-1",
      bookId: "book-fantasma",
    });

    const result = await listMyLoans.execute({ userId: "user-1" });

    expect(result).toHaveLength(1);
    expect(result[0].book.id).toBe("book-1");
  });

  it("retorna array vacío si el usuario no tiene préstamos", async () => {
    const { listMyLoans } = setup();

    const result = await listMyLoans.execute({ userId: "user-sin-loans" });

    expect(result).toEqual([]);
  });

  it("mapea los campos del préstamo al output esperado", async () => {
    const { loanRepository, bookRepository, listMyLoans } = setup();
    const book = await createBook(bookRepository, {
      id: "book-42",
      title: "Neuromancer",
      author: "Gibson",
      isbn: "9780441569595",
    });
    const loan = await createLoan(loanRepository, {
      userId: "user-1",
      bookId: "book-42",
      loanDate: new Date("2026-03-01"),
      dueDate: new Date("2026-03-15"),
    });

    const [result] = await listMyLoans.execute({ userId: "user-1" });

    expect(result).toEqual({
      id: loan.id,
      bookId: "book-42",
      userId: "user-1",
      loanDate: new Date("2026-03-01"),
      dueDate: new Date("2026-03-15"),
      status: "ACTIVE",
      book: {
        id: book.id,
        title: "Neuromancer",
        author: "Gibson",
        isbn: book.isbn,
      },
    });
  });
});
