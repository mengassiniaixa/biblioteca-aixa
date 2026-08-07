import { CancelReservation } from "./CancelReservation";
import { InMemoryReservationRepository } from "./__fakes__/InMemoryReservationRepository";
import { InMemoryUserRepository } from "./__fakes__/InMemoryUserRepository";
import { User } from "../../entities/User";
import { Reservation } from "../../entities/Reservation";
import { UserNotFoundError } from "../../errors/UserNotFoundError";
import { UnauthorizedError } from "../../errors/UnauthorizedError";
import { ReservationNotFoundError } from "../../errors/ReservationNotFoundError";

describe("CancelReservation", () => {
  function setup() {
    const reservationRepository = new InMemoryReservationRepository();
    const userRepository = new InMemoryUserRepository();
    const cancelReservation = new CancelReservation(
      reservationRepository,
      userRepository,
    );
    return { reservationRepository, userRepository, cancelReservation };
  }

  async function createUser(
    userRepository: InMemoryUserRepository,
    role: "MEMBER" | "LIBRARIAN" | "ADMIN" = "MEMBER",
    email = `${role.toLowerCase()}@test.com`,
  ) {
    const user = User.create({
      name: "User",
      email,
      passwordHash: "hash",
      role,
    });
    await userRepository.save(user);
    return user;
  }

  async function createReservation(
    reservationRepository: InMemoryReservationRepository,
    overrides: Partial<{
      id: string;
      bookId: string;
      userId: string;
      status: "PENDING" | "AVAILABLE" | "FULFILLED" | "CANCELLED";
      reservationDate: Date;
    }> = {},
  ) {
    const reservation = Reservation.reconstitute({
      id: overrides.id ?? "res-1",
      bookId: overrides.bookId ?? "book-1",
      userId: overrides.userId ?? "user-1",
      reservationDate: overrides.reservationDate ?? new Date("2026-01-01"),
      status: overrides.status ?? "PENDING",
    });
    await reservationRepository.save(reservation);
    return reservation;
  }

  it("el dueño de la reserva puede cancelarla aunque sea MEMBER", async () => {
    const { reservationRepository, userRepository, cancelReservation } =
      setup();
    const owner = await createUser(userRepository, "MEMBER");
    const reservation = await createReservation(reservationRepository, {
      userId: owner.id,
    });

    const result = await cancelReservation.execute({
      actorId: owner.id,
      reservationId: reservation.id,
    });

    expect(result.status).toBe("CANCELLED");

    const saved = await reservationRepository.findById(reservation.id);
    expect(saved?.status).toBe("CANCELLED");
  });

  it("un LIBRARIAN puede cancelar la reserva de otro usuario", async () => {
    const { reservationRepository, userRepository, cancelReservation } =
      setup();
    const librarian = await createUser(userRepository, "LIBRARIAN");
    const reservation = await createReservation(reservationRepository, {
      userId: "otro-usuario",
    });

    const result = await cancelReservation.execute({
      actorId: librarian.id,
      reservationId: reservation.id,
    });

    expect(result.status).toBe("CANCELLED");
  });

  it("un ADMIN puede cancelar la reserva de otro usuario", async () => {
    const { reservationRepository, userRepository, cancelReservation } =
      setup();
    const admin = await createUser(userRepository, "ADMIN");
    const reservation = await createReservation(reservationRepository, {
      userId: "otro-usuario",
    });

    const result = await cancelReservation.execute({
      actorId: admin.id,
      reservationId: reservation.id,
    });

    expect(result.status).toBe("CANCELLED");
  });

  it("cancela una reserva en estado AVAILABLE", async () => {
    const { reservationRepository, userRepository, cancelReservation } =
      setup();
    const owner = await createUser(userRepository, "MEMBER");
    const reservation = await createReservation(reservationRepository, {
      userId: owner.id,
      status: "AVAILABLE",
    });

    const result = await cancelReservation.execute({
      actorId: owner.id,
      reservationId: reservation.id,
    });

    expect(result.status).toBe("CANCELLED");
  });

  it("retorna id, bookId y userId de la reserva", async () => {
    const { reservationRepository, userRepository, cancelReservation } =
      setup();
    const owner = await createUser(userRepository, "MEMBER");
    const reservation = await createReservation(reservationRepository, {
      id: "res-42",
      bookId: "book-42",
      userId: owner.id,
    });

    const result = await cancelReservation.execute({
      actorId: owner.id,
      reservationId: reservation.id,
    });

    expect(result).toEqual({
      id: "res-42",
      bookId: "book-42",
      userId: owner.id,
      status: "CANCELLED",
    });
  });

  it("lanza UnauthorizedError si el actor es MEMBER y no es dueño", async () => {
    const { reservationRepository, userRepository, cancelReservation } =
      setup();
    const intruder = await createUser(userRepository, "MEMBER", "intruder@test.com");
    const reservation = await createReservation(reservationRepository, {
      userId: "dueño",
    });

    await expect(
      cancelReservation.execute({
        actorId: intruder.id,
        reservationId: reservation.id,
      }),
    ).rejects.toThrow(UnauthorizedError);

    const untouched = await reservationRepository.findById(reservation.id);
    expect(untouched?.status).toBe("PENDING");
  });

  it("lanza UserNotFoundError si el actor no existe", async () => {
    const { reservationRepository, cancelReservation } = setup();
    const reservation = await createReservation(reservationRepository);

    await expect(
      cancelReservation.execute({
        actorId: "no-existe",
        reservationId: reservation.id,
      }),
    ).rejects.toThrow(UserNotFoundError);
  });

  it("lanza ReservationNotFoundError si la reserva no existe", async () => {
    const { userRepository, cancelReservation } = setup();
    const actor = await createUser(userRepository, "MEMBER");

    await expect(
      cancelReservation.execute({
        actorId: actor.id,
        reservationId: "no-existe",
      }),
    ).rejects.toThrow(ReservationNotFoundError);
  });

  it("no permite cancelar una reserva ya FULFILLED", async () => {
    const { reservationRepository, userRepository, cancelReservation } =
      setup();
    const owner = await createUser(userRepository, "MEMBER");
    const reservation = await createReservation(reservationRepository, {
      userId: owner.id,
      status: "FULFILLED",
    });

    await expect(
      cancelReservation.execute({
        actorId: owner.id,
        reservationId: reservation.id,
      }),
    ).rejects.toThrow("Cannot cancel a fulfilled reservation");
  });
});
