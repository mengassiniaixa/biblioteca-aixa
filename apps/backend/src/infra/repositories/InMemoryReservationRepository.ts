import { Reservation, ReservationRepository } from "@mi-proyecto/domain";

export class InMemoryReservationRepository implements ReservationRepository {
  private reservations: Reservation[] = [];

  async save(reservation: Reservation): Promise<void> {
    const index = this.reservations.findIndex((r) => r.id === reservation.id);
    if (index >= 0) {
      this.reservations[index] = reservation;
    } else {
      this.reservations.push(reservation);
    }
  }

  async findById(id: string): Promise<Reservation | null> {
    return this.reservations.find((r) => r.id === id) ?? null;
  }

  async findPendingByBook(bookId: string): Promise<Reservation[]> {
    return this.reservations.filter(
      (r) => r.bookId === bookId && r.status === "PENDING",
    );
  }

  async findActiveByUser(userId: string): Promise<Reservation[]> {
    return this.reservations.filter(
      (r) =>
        r.userId === userId &&
        (r.status === "PENDING" || r.status === "AVAILABLE"),
    );
  }
}
