import { GetLibraryStats } from "./GetLibraryStats";
import { InMemoryBookRepository } from "./__fakes__/InMemoryBookRepository";
import { InMemoryLoanRepository } from "./__fakes__/InMemoryLoanRepository";
import { InMemoryUserRepository } from "./__fakes__/InMemoryUserRepository";
import { FakeClock } from "./__fakes__/FakeClock";
import { Book } from "../../entities/Book";
import { Loan } from "../../entities/Loan";
import { User } from "../../entities/User";
import { UserNotFoundError } from "../../errors/UserNotFoundError";
import { UnauthorizedError } from "../../errors/UnauthorizedError";

describe("GetLibraryStats", () => {
  function setup(today: Date = new Date("2026-02-01")) {
    const bookRepository = new InMemoryBookRepository();
    const loanRepository = new InMemoryLoanRepository();
    const userRepository = new InMemoryUserRepository();
    const clock = new FakeClock(today);
    const getLibraryStats = new GetLibraryStats(
      bookRepository,
      loanRepository,
      userRepository,
      clock,
    );
    return {
      bookRepository,
      loanRepository,
      userRepository,
      clock,
      getLibraryStats,
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
    email: string,
  ) {
    const member = User.create({
      name: "Socio",
      email,
      passwordHash: "hash",
      role: "MEMBER",
    });
    await userRepository.save(member);
    return member;
  }

  async function createBook(
    bookRepository: InMemoryBookRepository,
    isbn: string,
  ) {
    const book = Book.create({
      isbn,
      title: "Libro",
      author: "Autor",
      category: "General",
      totalCopies: 3,
    });
    await bookRepository.save(book);
    return book;
  }

  async function createLoan(
    loanRepository: InMemoryLoanRepository,
    overrides: {
      dueDate: Date;
      markReturned?: boolean;
    },
  ) {
    const loan = Loan.create({
      bookId: "book-1",
      userId: "user-1",
      loanDate: new Date("2026-01-01"),
      dueDate: overrides.dueDate,
    });
    if (overrides.markReturned) {
      loan.markAsReturned(new Date("2026-01-20"));
    }
    await loanRepository.save(loan);
    return loan;
  }

  it("retorna totales cuando el actor es LIBRARIAN", async () => {
    const {
      bookRepository,
      loanRepository,
      userRepository,
      getLibraryStats,
    } = setup(new Date("2026-02-01"));
    const actor = await createActor(userRepository, "LIBRARIAN");
    await createMember(userRepository, "m1@test.com");
    await createMember(userRepository, "m2@test.com");
    await createBook(bookRepository, "9780441172719");
    await createBook(bookRepository, "9780261102217");
    await createBook(bookRepository, "9780132350884");
    await createLoan(loanRepository, { dueDate: new Date("2026-01-15") });
    await createLoan(loanRepository, { dueDate: new Date("2026-03-01") });
    await createLoan(loanRepository, {
      dueDate: new Date("2026-01-10"),
      markReturned: true,
    });

    const result = await getLibraryStats.execute({ actorId: actor.id });

    expect(result).toEqual({
      totalBooks: 3,
      activeLoans: 2,
      overdueLoans: 1,
      totalMembers: 2,
    });
  });

  it("retorna totales cuando el actor es ADMIN", async () => {
    const { userRepository, getLibraryStats } = setup();
    const actor = await createActor(userRepository, "ADMIN");

    const result = await getLibraryStats.execute({ actorId: actor.id });

    expect(result).toEqual({
      totalBooks: 0,
      activeLoans: 0,
      overdueLoans: 0,
      totalMembers: 0,
    });
  });

  it("retorna ceros cuando no hay data", async () => {
    const { userRepository, getLibraryStats } = setup();
    const actor = await createActor(userRepository, "LIBRARIAN");

    const result = await getLibraryStats.execute({ actorId: actor.id });

    expect(result).toEqual({
      totalBooks: 0,
      activeLoans: 0,
      overdueLoans: 0,
      totalMembers: 0,
    });
  });

  it("no cuenta a LIBRARIAN ni ADMIN dentro de totalMembers", async () => {
    const { userRepository, getLibraryStats } = setup();
    const actor = await createActor(userRepository, "LIBRARIAN");
    await createActor(userRepository, "ADMIN");
    await createMember(userRepository, "solo@test.com");

    const result = await getLibraryStats.execute({ actorId: actor.id });

    expect(result.totalMembers).toBe(1);
  });

  it("lanza UserNotFoundError si el actor no existe", async () => {
    const { getLibraryStats } = setup();

    await expect(
      getLibraryStats.execute({ actorId: "no-existe" }),
    ).rejects.toThrow(UserNotFoundError);
  });

  it("lanza UnauthorizedError si el actor es MEMBER", async () => {
    const { userRepository, getLibraryStats } = setup();
    const actor = await createActor(userRepository, "MEMBER");

    await expect(
      getLibraryStats.execute({ actorId: actor.id }),
    ).rejects.toThrow(UnauthorizedError);
  });
});
