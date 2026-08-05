import { Loan } from "../entities/Loan";

export interface LoanRepository {
  save(loan: Loan): Promise<void>;
  findById(id: string): Promise<Loan | null>;
  findActiveByUserAndBook(userId: string, bookId: string): Promise<Loan | null>;
  findActiveByUser(userId: string): Promise<Loan[]>;
  findOverdue(today: Date): Promise<Loan[]>;
}
