import { Reservation } from "../entities/Reservation";

export interface ReservationRepository {
  save(reservation: Reservation): Promise<void>;
  findById(id: string): Promise<Reservation | null>;
  findPendingByBook(bookId: string): Promise<Reservation[]>;
  findActiveByUser(userId: string): Promise<Reservation[]>;
}
