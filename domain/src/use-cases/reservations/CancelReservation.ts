import { ReservationRepository } from "../../repositories/ReservationRepository";
import { UserRepository } from "../../repositories/UserRepository";
import { ReservationNotFoundError } from "../../errors/ReservationNotFoundError";
import { UserNotFoundError } from "../../errors/UserNotFoundError";
import { UnauthorizedError } from "../../errors/UnauthorizedError";

interface CancelReservationInput {
  actorId: string;
  reservationId: string;
}

interface CancelReservationOutput {
  id: string;
  bookId: string;
  userId: string;
  status: string;
}

export class CancelReservation {
  constructor(
    private reservationRepository: ReservationRepository,
    private userRepository: UserRepository,
  ) {}

  async execute(
    input: CancelReservationInput,
  ): Promise<CancelReservationOutput> {
    const actor = await this.userRepository.findById(input.actorId);
    if (!actor) {
      throw new UserNotFoundError(input.actorId);
    }

    const reservation = await this.reservationRepository.findById(
      input.reservationId,
    );
    if (!reservation) {
      throw new ReservationNotFoundError(input.reservationId);
    }

    const isOwner = reservation.userId === actor.id;
    if (!isOwner && !actor.isLibrarianOrAdmin()) {
      throw new UnauthorizedError("cancel reservation");
    }

    reservation.cancel();
    await this.reservationRepository.save(reservation);

    return {
      id: reservation.id,
      bookId: reservation.bookId,
      userId: reservation.userId,
      status: reservation.status,
    };
  }
}
