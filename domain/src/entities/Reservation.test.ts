import { Reservation } from "./Reservation";

describe("Reservation", () => {
  it("crea una reserva en estado PENDING", () => {
    const reservation = Reservation.create({ bookId: "b1", userId: "u1" });
    expect(reservation.status).toBe("PENDING");
  });

  it("markAsAvailable cambia PENDING a AVAILABLE", () => {
    const reservation = Reservation.create({ bookId: "b1", userId: "u1" });
    reservation.markAsAvailable();
    expect(reservation.status).toBe("AVAILABLE");
  });

  it("no permite markAsAvailable si no está PENDING", () => {
    const reservation = Reservation.create({ bookId: "b1", userId: "u1" });
    reservation.markAsAvailable();
    expect(() => reservation.markAsAvailable()).toThrow(
      "Only pending reservations can become available",
    );
  });

  it("fulfill requiere que esté AVAILABLE", () => {
    const reservation = Reservation.create({ bookId: "b1", userId: "u1" });
    expect(() => reservation.fulfill()).toThrow(
      "Reservation must be available to fulfill",
    );
  });

  it("cancel funciona en cualquier estado excepto FULFILLED", () => {
    const reservation = Reservation.create({ bookId: "b1", userId: "u1" });
    reservation.cancel();
    expect(reservation.status).toBe("CANCELLED");
  });

  it("no permite cancelar una reserva FULFILLED", () => {
    const reservation = Reservation.create({ bookId: "b1", userId: "u1" });
    reservation.markAsAvailable();
    reservation.fulfill();
    expect(() => reservation.cancel()).toThrow(
      "Cannot cancel a fulfilled reservation",
    );
  });
});
