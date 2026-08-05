import { DomainError } from "./DomainError";

export class ReservationNotFoundError extends DomainError {
  constructor(reservationId: string) {
    super(`Reservation with id ${reservationId} not found`);
    this.name = "ReservationNotFoundError";
  }
}
