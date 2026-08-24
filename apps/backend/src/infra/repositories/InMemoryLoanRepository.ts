import { Loan, LoanRepository } from "@mi-proyecto/domain";

export class InMemoryLoanRepository implements LoanRepository {
  private loans: Loan[] = [];

  async save(loan: Loan): Promise<void> {
    const index = this.loans.findIndex((l) => l.id === loan.id);
    if (index >= 0) {
      this.loans[index] = loan;
    } else {
      this.loans.push(loan);
    }
  }

  async findById(id: string): Promise<Loan | null> {
    return this.loans.find((l) => l.id === id) ?? null;
  }

  async findActiveByUserAndBook(
    userId: string,
    bookId: string,
  ): Promise<Loan | null> {
    return (
      this.loans.find(
        (l) =>
          l.userId === userId && l.bookId === bookId && l.status === "ACTIVE",
      ) ?? null
    );
  }

  async findActiveByUser(userId: string): Promise<Loan[]> {
    return this.loans.filter(
      (l) => l.userId === userId && l.status === "ACTIVE",
    );
  }

  async findOverdue(today: Date): Promise<Loan[]> {
    return this.loans.filter((l) => l.isOverdue(today));
  }
}
