import { LoanRepository } from "../../repositories/LoanRepository";
import { UserRepository } from "../../repositories/UserRepository";
import { Clock } from "../../services/Clock";
import { UserNotFoundError } from "../../errors/UserNotFoundError";
import { UnauthorizedError } from "../../errors/UnauthorizedError";

interface ListOverdueLoansInput {
  actorId: string;
}

interface OverdueLoanOutput {
  id: string;
  bookId: string;
  userId: string;
  loanDate: Date;
  dueDate: Date;
  status: string;
}

export class ListOverdueLoans {
  constructor(
    private loanRepository: LoanRepository,
    private userRepository: UserRepository,
    private clock: Clock,
  ) {}

  async execute(input: ListOverdueLoansInput): Promise<OverdueLoanOutput[]> {
    const actor = await this.userRepository.findById(input.actorId);
    if (!actor) {
      throw new UserNotFoundError(input.actorId);
    }
    if (!actor.isLibrarianOrAdmin()) {
      throw new UnauthorizedError("list overdue loans");
    }

    const today = this.clock.now();
    const loans = await this.loanRepository.findOverdue(today);

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
