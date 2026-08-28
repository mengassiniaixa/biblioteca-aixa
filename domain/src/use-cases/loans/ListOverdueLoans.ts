import { LoanRepository } from "../../repositories/LoanRepository";
import { UserRepository } from "../../repositories/UserRepository";
import { BookRepository } from "../../repositories/BookRepository";
import { Clock } from "../../services/Clock";
import { UserNotFoundError } from "../../errors/UserNotFoundError";
import { UnauthorizedError } from "../../errors/UnauthorizedError";

interface ListOverdueLoansInput {
  actorId: string;
}

interface OverdueLoanOutput {
  id: string;
  loanDate: Date;
  dueDate: Date;
  daysOverdue: number;
  book: {
    id: string;
    title: string;
    author: string;
    isbn: string;
  };
  member: {
    id: string;
    name: string;
    email: string;
  };
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export class ListOverdueLoans {
  constructor(
    private loanRepository: LoanRepository,
    private userRepository: UserRepository,
    private bookRepository: BookRepository,
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

    const outputs: OverdueLoanOutput[] = [];
    for (const loan of loans) {
      const book = await this.bookRepository.findById(loan.bookId);
      const member = await this.userRepository.findById(loan.userId);
      if (!book || !member) continue;

      outputs.push({
        id: loan.id,
        loanDate: loan.loanDate,
        dueDate: loan.dueDate,
        daysOverdue: Math.floor(
          (today.getTime() - loan.dueDate.getTime()) / MS_PER_DAY,
        ),
        book: {
          id: book.id,
          title: book.title,
          author: book.author,
          isbn: book.isbn,
        },
        member: {
          id: member.id,
          name: member.name,
          email: member.email,
        },
      });
    }
    return outputs;
  }
}
