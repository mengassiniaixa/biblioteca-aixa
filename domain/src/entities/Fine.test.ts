import { Fine } from "./Fine";

describe("Fine", () => {
  it("crea una multa no pagada", () => {
    const fine = Fine.create({ loanId: "l1", userId: "u1", amount: 500 });
    expect(fine.paid).toBe(false);
    expect(fine.amount).toBe(500);
  });

  it("no permite crear una multa con monto <= 0", () => {
    expect(() =>
      Fine.create({ loanId: "l1", userId: "u1", amount: 0 }),
    ).toThrow("Fine amount must be > 0");
  });

  it("markAsPaid cambia paid a true", () => {
    const fine = Fine.create({ loanId: "l1", userId: "u1", amount: 500 });
    fine.markAsPaid();
    expect(fine.paid).toBe(true);
  });

  it("no permite pagar una multa ya pagada", () => {
    const fine = Fine.create({ loanId: "l1", userId: "u1", amount: 500 });
    fine.markAsPaid();
    expect(() => fine.markAsPaid()).toThrow("Fine already paid");
  });
});
