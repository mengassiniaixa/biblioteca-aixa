import { LoanRepository } from "../../repositories/LoanRepository";

interface ListMyLoansInput {
  userId: string;
}

interface MyLoanOutput {
  id: string;
  bookId: string;
  userId: string;
  loanDate: Date;
  dueDate: Date;
  status: string;
}

export class ListMyLoans {
  constructor(private loanRepository: LoanRepository) {}

  async execute(input: ListMyLoansInput): Promise<MyLoanOutput[]> {
    const loans = await this.loanRepository.findActiveByUser(input.userId);

    return loans.map((loan) => ({
      id: loan.id,
      bookId: loan.bookId,
      userId: loan.userId,
      loanDate: loan.loanDate,
      dueDate: loan.dueDate,
      status: loan.status,
    }));
  }
}
