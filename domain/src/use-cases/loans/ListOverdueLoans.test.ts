import { ListOverdueLoans } from "./ListOverdueLoans";
import { InMemoryLoanRepository } from "./__fakes__/InMemoryLoanRepository";
import { InMemoryUserRepository } from "./__fakes__/InMemoryUserRepository";
import { InMemoryBookRepository } from "./__fakes__/InMemoryBookRepository";
import { FakeClock } from "./__fakes__/FakeClock";
import { Loan } from "../../entities/Loan";
import { User } from "../../entities/User";
import { Book } from "../../entities/Book";
import { UserNotFoundError } from "../../errors/UserNotFoundError";
import { UnauthorizedError } from "../../errors/UnauthorizedError";

describe("ListOverdueLoans", () => {
  function setup(today: Date = new Date("2026-02-01")) {
    const loanRepository = new InMemoryLoanRepository();
    const userRepository = new InMemoryUserRepository();
    const bookRepository = new InMemoryBookRepository();
    const clock = new FakeClock(today);
    const listOverdueLoans = new ListOverdueLoans(
      loanRepository,
      userRepository,
      bookRepository,
      clock,
    );
    return {
      loanRepository,
      userRepository,
      bookRepository,
      clock,
      listOverdueLoans,
    };
  }

  async function createActor(
    userRepository: InMemoryUserRepository,
    role: "MEMBER" | "LIBRARIAN" | "ADMIN" = "LIBRARIAN",
  ) {
    const actor = User.create({
      name: "Actor",
      email: `actor-${role.toLowerCase()}@test.com`,
      passwordHash: "hash",
      role,
    });
    await userRepository.save(actor);
    return actor;
  }

  async function createMember(
    userRepository: InMemoryUserRepository,
    overrides: Partial<{ name: string; email: string }> = {},
  ) {
    const member = User.create({
      name: overrides.name ?? "Socio",
      email: overrides.email ?? "socio@test.com",
      passwordHash: "hash",
      role: "MEMBER",
    });
    await userRepository.save(member);
    return member;
  }

  async function createBook(
    bookRepository: InMemoryBookRepository,
    overrides: Partial<{
      title: string;
      author: string;
      isbn: string;
      category: string;
    }> = {},
  ) {
    const book = Book.create({
      isbn: overrides.isbn ?? "9780441172719",
      title: overrides.title ?? "Dune",
      author: overrides.author ?? "Frank Herbert",
      category: overrides.category ?? "SciFi",
      totalCopies: 3,
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
      loan.markAsReturned(overrides.returnDate ?? new Date("2026-01-20"));
    }
    await loanRepository.save(loan);
    return loan;
  }

  it("retorna los préstamos vencidos con datos del libro y del socio cuando el actor es LIBRARIAN", async () => {
    const { loanRepository, userRepository, bookRepository, listOverdueLoans } =
      setup(new Date("2026-02-01"));
    const actor = await createActor(userRepository, "LIBRARIAN");
    const member = await createMember(userRepository, {
      name: "Ana",
      email: "ana@test.com",
    });
    const book = await createBook(bookRepository, { title: "Dune" });
    const overdue = await createLoan(loanRepository, {
      bookId: book.id,
      userId: member.id,
      dueDate: new Date("2026-01-15"),
    });

    const result = await listOverdueLoans.execute({ actorId: actor.id });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(overdue.id);
    expect(result[0].book.title).toBe("Dune");
    expect(result[0].member.name).toBe("Ana");
    expect(result[0].member.email).toBe("ana@test.com");
  });

  it("retorna los préstamos vencidos cuando el actor es ADMIN", async () => {
    const { loanRepository, userRepository, bookRepository, listOverdueLoans } =
      setup();
    const actor = await createActor(userRepository, "ADMIN");
    const member = await createMember(userRepository);
    const book = await createBook(bookRepository);
    await createLoan(loanRepository, { bookId: book.id, userId: member.id });

    const result = await listOverdueLoans.execute({ actorId: actor.id });

    expect(result).toHaveLength(1);
  });

  it("retorna array vacío si no hay préstamos vencidos", async () => {
    const { loanRepository, userRepository, bookRepository, listOverdueLoans } =
      setup(new Date("2026-01-10"));
    const actor = await createActor(userRepository, "LIBRARIAN");
    const member = await createMember(userRepository);
    const book = await createBook(bookRepository);
    await createLoan(loanRepository, {
      bookId: book.id,
      userId: member.id,
      dueDate: new Date("2026-01-15"),
    });

    const result = await listOverdueLoans.execute({ actorId: actor.id });

    expect(result).toEqual([]);
  });

  it("excluye préstamos ya devueltos aunque su dueDate haya pasado", async () => {
    const { loanRepository, userRepository, bookRepository, listOverdueLoans } =
      setup(new Date("2026-02-01"));
    const actor = await createActor(userRepository, "LIBRARIAN");
    const member = await createMember(userRepository);
    const book = await createBook(bookRepository);
    await createLoan(loanRepository, {
      bookId: book.id,
      userId: member.id,
      dueDate: new Date("2026-01-15"),
      markReturned: true,
    });
    const stillOverdue = await createLoan(loanRepository, {
      bookId: book.id,
      userId: member.id,
      dueDate: new Date("2026-01-20"),
    });

    const result = await listOverdueLoans.execute({ actorId: actor.id });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(stillOverdue.id);
  });

  it("calcula daysOverdue en días completos desde dueDate", async () => {
    const { loanRepository, userRepository, bookRepository, listOverdueLoans } =
      setup(new Date("2026-02-01"));
    const actor = await createActor(userRepository, "LIBRARIAN");
    const member = await createMember(userRepository);
    const book = await createBook(bookRepository);
    await createLoan(loanRepository, {
      bookId: book.id,
      userId: member.id,
      dueDate: new Date("2026-01-15"),
    });

    const result = await listOverdueLoans.execute({ actorId: actor.id });

    expect(result[0].daysOverdue).toBe(17);
  });

  it("mapea todos los campos del préstamo, libro y socio", async () => {
    const { loanRepository, userRepository, bookRepository, listOverdueLoans } =
      setup(new Date("2026-02-01"));
    const actor = await createActor(userRepository, "LIBRARIAN");
    const member = await createMember(userRepository, {
      name: "Ana",
      email: "ana@test.com",
    });
    const book = await createBook(bookRepository, {
      title: "Dune",
      author: "Frank Herbert",
      isbn: "9780441172719",
    });
    const loan = await createLoan(loanRepository, {
      bookId: book.id,
      userId: member.id,
      loanDate: new Date("2026-01-01"),
      dueDate: new Date("2026-01-15"),
    });

    const result = await listOverdueLoans.execute({ actorId: actor.id });

    expect(result[0]).toEqual({
      id: loan.id,
      loanDate: new Date("2026-01-01"),
      dueDate: new Date("2026-01-15"),
      daysOverdue: 17,
      book: {
        id: book.id,
        title: "Dune",
        author: "Frank Herbert",
        isbn: "9780441172719",
      },
      member: {
        id: member.id,
        name: "Ana",
        email: "ana@test.com",
      },
    });
  });

  it("omite préstamos cuyo libro o socio no exista (data inconsistente)", async () => {
    const { loanRepository, userRepository, bookRepository, listOverdueLoans } =
      setup(new Date("2026-02-01"));
    const actor = await createActor(userRepository, "LIBRARIAN");
    const member = await createMember(userRepository);
    const book = await createBook(bookRepository);
    await createLoan(loanRepository, {
      bookId: "book-fantasma",
      userId: member.id,
      dueDate: new Date("2026-01-10"),
    });
    const ok = await createLoan(loanRepository, {
      bookId: book.id,
      userId: member.id,
      dueDate: new Date("2026-01-12"),
    });

    const result = await listOverdueLoans.execute({ actorId: actor.id });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(ok.id);
  });

  it("lanza UserNotFoundError si el actor no existe", async () => {
    const { listOverdueLoans } = setup();

    await expect(
      listOverdueLoans.execute({ actorId: "no-existe" }),
    ).rejects.toThrow(UserNotFoundError);
  });

  it("lanza UnauthorizedError si el actor es MEMBER", async () => {
    const { userRepository, listOverdueLoans } = setup();
    const actor = await createActor(userRepository, "MEMBER");

    await expect(
      listOverdueLoans.execute({ actorId: actor.id }),
    ).rejects.toThrow(UnauthorizedError);
  });
});
