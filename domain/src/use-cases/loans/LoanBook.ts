import { Loan } from "../../entities/Loan";
import { BookRepository } from "../../repositories/BookRepository";
import { LoanRepository } from "../../repositories/LoanRepository";
import { Clock } from "../../services/Clock";
import { BookNotFoundError } from "../../errors/BookNotFoundError";
import { BookNotAvailableError } from "../../errors/BookNotAvailableError";
import { LoanLimitExceededError } from "../../errors/LoanLimitExceededError";
import { BookAlreadyLoanedError } from "../../errors/BookAlreadyLoanedError";

const MAX_ACTIVE_LOANS_PER_USER = 3;
const LOAN_PERIOD_DAYS = 14;

interface LoanBookInput {
  bookId: string;
  userId: string;
}

interface LoanBookOutput {
  id: string;
  bookId: string;
  userId: string;
  loanDate: Date;
  dueDate: Date;
  status: string;
}

export class LoanBook {
  constructor(
    private bookRepository: BookRepository,
    private loanRepository: LoanRepository,
    private clock: Clock,
  ) {}

  async execute(input: LoanBookInput): Promise<LoanBookOutput> {
    const book = await this.bookRepository.findById(input.bookId);
    if (!book) {
      throw new BookNotFoundError(input.bookId);
    }

    if (!book.hasAvailableCopies()) {
      throw new BookNotAvailableError(input.bookId);
    }

    const existingLoan = await this.loanRepository.findActiveByUserAndBook(
      input.userId,
      input.bookId,
    );
    if (existingLoan) {
      throw new BookAlreadyLoanedError(input.userId, input.bookId);
    }

    const activeLoans = await this.loanRepository.findActiveByUser(
      input.userId,
    );
    if (activeLoans.length >= MAX_ACTIVE_LOANS_PER_USER) {
      throw new LoanLimitExceededError(input.userId, MAX_ACTIVE_LOANS_PER_USER);
    }

    const loanDate = this.clock.now();
    const dueDate = new Date(loanDate);
    dueDate.setDate(dueDate.getDate() + LOAN_PERIOD_DAYS);

    const loan = Loan.create({
      bookId: input.bookId,
      userId: input.userId,
      loanDate,
      dueDate,
    });

    book.decreaseAvailability();

    await this.bookRepository.save(book);
    await this.loanRepository.save(loan);

    return {
      id: loan.id,
      bookId: loan.bookId,
      userId: loan.userId,
      loanDate: loan.loanDate,
      dueDate: loan.dueDate,
      status: loan.status,
    };
  }
}
