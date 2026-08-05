import { randomUUID } from "crypto";

export type ReservationStatus =
  | "PENDING"
  | "AVAILABLE"
  | "FULFILLED"
  | "CANCELLED";

interface ReservationProps {
  id: string;
  bookId: string;
  userId: string;
  reservationDate: Date;
  status: ReservationStatus;
}

export class Reservation {
  private constructor(private props: ReservationProps) {}

  static create(input: { bookId: string; userId: string }): Reservation {
    return new Reservation({
      id: randomUUID(),
      bookId: input.bookId,
      userId: input.userId,
      reservationDate: new Date(),
      status: "PENDING",
    });
  }

  static reconstitute(props: ReservationProps): Reservation {
    return new Reservation(props);
  }

  get id() {
    return this.props.id;
  }
  get bookId() {
    return this.props.bookId;
  }
  get userId() {
    return this.props.userId;
  }
  get reservationDate() {
    return this.props.reservationDate;
  }
  get status() {
    return this.props.status;
  }

  markAsAvailable(): void {
    if (this.props.status !== "PENDING") {
      throw new Error("Only pending reservations can become available");
    }
    this.props.status = "AVAILABLE";
  }

  cancel(): void {
    if (this.props.status === "FULFILLED") {
      throw new Error("Cannot cancel a fulfilled reservation");
    }
    this.props.status = "CANCELLED";
  }

  fulfill(): void {
    if (this.props.status !== "AVAILABLE") {
      throw new Error("Reservation must be available to fulfill");
    }
    this.props.status = "FULFILLED";
  }
}
