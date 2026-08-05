import { DomainError } from "./DomainError";

export class EmailAlreadyInUseError extends DomainError {
  constructor(email: string) {
    super(`Email ${email} is already in use`);
    this.name = "EmailAlreadyInUseError";
  }
}
