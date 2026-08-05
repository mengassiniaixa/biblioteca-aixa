import { DomainError } from "./DomainError";

export class UnauthorizedError extends DomainError {
  constructor(action: string) {
    super(`Not authorized to perform action: ${action}`);
    this.name = "UnauthorizedError";
  }
}
