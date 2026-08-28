import { ReservationRepository } from "../../repositories/ReservationRepository";

interface ListMyReservationsInput {
  userId: string;
}

interface MyReservationOutput {
  id: string;
  bookId: string;
  userId: string;
  reservationDate: Date;
  status: string;
}

export class ListMyReservations {
  constructor(private reservationRepository: ReservationRepository) {}

  async execute(input: ListMyReservationsInput): Promise<MyReservationOutput[]> {
    const reservations = await this.reservationRepository.findActiveByUser(
      input.userId,
    );

    return reservations.map((reservation) => ({
      id: reservation.id,
      bookId: reservation.bookId,
      userId: reservation.userId,
      reservationDate: reservation.reservationDate,
      status: reservation.status,
    }));
  }
}
