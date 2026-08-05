import { DomainError } from "./DomainError";

export class UserNotFoundError extends DomainError {
  constructor(userId: string) {
    super(`User with id ${userId} not found`);
    this.name = "UserNotFoundError";
  }
}
