import { Loan } from "./Loan";

describe("Loan", () => {
  const bookId = "book-1";
  const userId = "user-1";

  it("crea un préstamo ACTIVE con dueDate posterior a loanDate", () => {
    const loanDate = new Date("2026-01-01");
    const dueDate = new Date("2026-01-15");

    const loan = Loan.create({ bookId, userId, loanDate, dueDate });

    expect(loan.status).toBe("ACTIVE");
    expect(loan.returnDate).toBeUndefined();
  });

  it("no permite crear un préstamo con dueDate anterior o igual a loanDate", () => {
    const loanDate = new Date("2026-01-15");
    const dueDate = new Date("2026-01-01");

    expect(() => Loan.create({ bookId, userId, loanDate, dueDate })).toThrow(
      "dueDate must be after loanDate",
    );
  });

  it("markAsReturned cambia el status a RETURNED y setea returnDate", () => {
    const loan = Loan.create({
      bookId,
      userId,
      loanDate: new Date("2026-01-01"),
      dueDate: new Date("2026-01-15"),
    });

    const returnDate = new Date("2026-01-10");
    loan.markAsReturned(returnDate);

    expect(loan.status).toBe("RETURNED");
    expect(loan.returnDate).toEqual(returnDate);
  });

  it("no permite devolver un préstamo ya devuelto", () => {
    const loan = Loan.create({
      bookId,
      userId,
      loanDate: new Date("2026-01-01"),
      dueDate: new Date("2026-01-15"),
    });
    loan.markAsReturned(new Date("2026-01-10"));

    expect(() => loan.markAsReturned(new Date("2026-01-11"))).toThrow(
      "Loan already returned",
    );
  });

  it("isOverdue devuelve true si hoy es posterior a dueDate y sigue ACTIVE", () => {
    const loan = Loan.create({
      bookId,
      userId,
      loanDate: new Date("2026-01-01"),
      dueDate: new Date("2026-01-15"),
    });

    expect(loan.isOverdue(new Date("2026-01-20"))).toBe(true);
  });

  it("isOverdue devuelve false si el préstamo ya fue devuelto", () => {
    const loan = Loan.create({
      bookId,
      userId,
      loanDate: new Date("2026-01-01"),
      dueDate: new Date("2026-01-15"),
    });
    loan.markAsReturned(new Date("2026-01-10"));

    expect(loan.isOverdue(new Date("2026-01-20"))).toBe(false);
  });
});
