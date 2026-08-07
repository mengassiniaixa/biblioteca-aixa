import { ListOverdueLoans } from "./ListOverdueLoans";
import { InMemoryLoanRepository } from "./__fakes__/InMemoryLoanRepository";
import { InMemoryUserRepository } from "./__fakes__/InMemoryUserRepository";
import { FakeClock } from "./__fakes__/FakeClock";
import { Loan } from "../../entities/Loan";
import { User } from "../../entities/User";
import { UserNotFoundError } from "../../errors/UserNotFoundError";
import { UnauthorizedError } from "../../errors/UnauthorizedError";

describe("ListOverdueLoans", () => {
  function setup(today: Date = new Date("2026-02-01")) {
    const loanRepository = new InMemoryLoanRepository();
    const userRepository = new InMemoryUserRepository();
    const clock = new FakeClock(today);
    const listOverdueLoans = new ListOverdueLoans(
      loanRepository,
      userRepository,
      clock,
    );
    return { loanRepository, userRepository, clock, listOverdueLoans };
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

  it("retorna los préstamos vencidos cuando el actor es LIBRARIAN", async () => {
    const { loanRepository, userRepository, listOverdueLoans } = setup(
      new Date("2026-02-01"),
    );
    const actor = await createActor(userRepository, "LIBRARIAN");
    const overdue = await createLoan(loanRepository, {
      dueDate: new Date("2026-01-15"),
    });

    const result = await listOverdueLoans.execute({ actorId: actor.id });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(overdue.id);
    expect(result[0].status).toBe("ACTIVE");
  });

  it("retorna los préstamos vencidos cuando el actor es ADMIN", async () => {
    const { loanRepository, userRepository, listOverdueLoans } = setup();
    const actor = await createActor(userRepository, "ADMIN");
    await createLoan(loanRepository);

    const result = await listOverdueLoans.execute({ actorId: actor.id });

    expect(result).toHaveLength(1);
  });

  it("retorna array vacío si no hay préstamos vencidos", async () => {
    const { loanRepository, userRepository, listOverdueLoans } = setup(
      new Date("2026-01-10"),
    );
    const actor = await createActor(userRepository, "LIBRARIAN");
    await createLoan(loanRepository, { dueDate: new Date("2026-01-15") });

    const result = await listOverdueLoans.execute({ actorId: actor.id });

    expect(result).toEqual([]);
  });

  it("excluye préstamos ya devueltos aunque su dueDate haya pasado", async () => {
    const { loanRepository, userRepository, listOverdueLoans } = setup(
      new Date("2026-02-01"),
    );
    const actor = await createActor(userRepository, "LIBRARIAN");
    await createLoan(loanRepository, {
      userId: "user-devuelto",
      dueDate: new Date("2026-01-15"),
      markReturned: true,
    });
    const stillOverdue = await createLoan(loanRepository, {
      userId: "user-activo",
      dueDate: new Date("2026-01-20"),
    });

    const result = await listOverdueLoans.execute({ actorId: actor.id });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(stillOverdue.id);
  });

  it("mapea los campos del préstamo al output esperado", async () => {
    const { loanRepository, userRepository, listOverdueLoans } = setup(
      new Date("2026-02-01"),
    );
    const actor = await createActor(userRepository, "LIBRARIAN");
    const loan = await createLoan(loanRepository, {
      bookId: "book-42",
      userId: "user-42",
      loanDate: new Date("2026-01-01"),
      dueDate: new Date("2026-01-15"),
    });

    const result = await listOverdueLoans.execute({ actorId: actor.id });

    expect(result[0]).toEqual({
      id: loan.id,
      bookId: "book-42",
      userId: "user-42",
      loanDate: new Date("2026-01-01"),
      dueDate: new Date("2026-01-15"),
      status: "ACTIVE",
    });
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
