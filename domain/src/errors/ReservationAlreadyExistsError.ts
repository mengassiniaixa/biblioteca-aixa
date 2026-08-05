import { DomainError } from "./DomainError";

export class ReservationAlreadyExistsError extends DomainError {
  constructor(userId: string, bookId: string) {
    super(
      `User ${userId} already has a pending reservation for book ${bookId}`,
    );
    this.name = "ReservationAlreadyExistsError";
  }
}
