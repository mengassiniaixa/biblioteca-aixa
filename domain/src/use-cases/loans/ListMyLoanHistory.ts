import { LoanRepository } from "../../repositories/LoanRepository";
import { BookRepository } from "../../repositories/BookRepository";

interface ListMyLoanHistoryInput {
  userId: string;
}

interface LoanHistoryEntry {
  id: string;
  bookId: string;
  userId: string;
  loanDate: Date;
  dueDate: Date;
  returnDate: Date | null;
  status: string;
  book: {
    id: string;
    title: string;
    author: string;
    isbn: string;
  };
}

export class ListMyLoanHistory {
  constructor(
    private loanRepository: LoanRepository,
    private bookRepository: BookRepository,
  ) {}

  async execute(input: ListMyLoanHistoryInput): Promise<LoanHistoryEntry[]> {
    const loans = await this.loanRepository.findByUser(input.userId);

    const outputs: LoanHistoryEntry[] = [];
    for (const loan of loans) {
      const book = await this.bookRepository.findById(loan.bookId);
      if (!book) continue;

      outputs.push({
        id: loan.id,
        bookId: loan.bookId,
        userId: loan.userId,
        loanDate: loan.loanDate,
        dueDate: loan.dueDate,
        returnDate: loan.returnDate ?? null,
        status: loan.status,
        book: {
          id: book.id,
          title: book.title,
          author: book.author,
          isbn: book.isbn,
        },
      });
    }

    outputs.sort((a, b) => b.loanDate.getTime() - a.loanDate.getTime());
    return outputs;
  }
}
