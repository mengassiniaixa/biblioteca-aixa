import { ListMyLoans } from "./ListMyLoans";
import { InMemoryLoanRepository } from "./__fakes__/InMemoryLoanRepository";
import { Loan } from "../../entities/Loan";

describe("ListMyLoans", () => {
  function setup() {
    const loanRepository = new InMemoryLoanRepository();
    const listMyLoans = new ListMyLoans(loanRepository);
    return { loanRepository, listMyLoans };
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

  it("retorna los préstamos activos del usuario", async () => {
    const { loanRepository, listMyLoans } = setup();
    const own = await createLoan(loanRepository, { userId: "user-1" });

    const result = await listMyLoans.execute({ userId: "user-1" });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(own.id);
    expect(result[0].status).toBe("ACTIVE");
  });

  it("excluye los préstamos de otros usuarios", async () => {
    const { loanRepository, listMyLoans } = setup();
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
    const { loanRepository, listMyLoans } = setup();
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

  it("retorna array vacío si el usuario no tiene préstamos", async () => {
    const { listMyLoans } = setup();

    const result = await listMyLoans.execute({ userId: "user-sin-loans" });

    expect(result).toEqual([]);
  });

  it("mapea los campos del préstamo al output esperado", async () => {
    const { loanRepository, listMyLoans } = setup();
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
    });
  });
});
