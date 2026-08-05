import { DomainError } from "./DomainError";

export class LoanLimitExceededError extends DomainError {
  constructor(userId: string, limit: number) {
    super(`User ${userId} has reached the loan limit of ${limit}`);
    this.name = "LoanLimitExceededError";
  }
}
