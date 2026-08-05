import { DomainError } from "./DomainError";

export class LoanNotFoundError extends DomainError {
  constructor(loanId: string) {
    super(`Loan with id ${loanId} not found`);
    this.name = "LoanNotFoundError";
  }
}
