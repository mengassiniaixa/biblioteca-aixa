import { ListMyReservations } from "./ListMyReservations";
import { InMemoryReservationRepository } from "./__fakes__/InMemoryReservationRepository";
import { Reservation } from "../../entities/Reservation";

describe("ListMyReservations", () => {
  function setup() {
    const reservationRepository = new InMemoryReservationRepository();
    const listMyReservations = new ListMyReservations(reservationRepository);
    return { reservationRepository, listMyReservations };
  }

  async function createReservation(
    reservationRepository: InMemoryReservationRepository,
    overrides: Partial<{
      bookId: string;
      userId: string;
      markAvailable: boolean;
      markCancelled: boolean;
      markFulfilled: boolean;
    }> = {},
  ) {
    const reservation = Reservation.create({
      bookId: overrides.bookId ?? "book-1",
      userId: overrides.userId ?? "user-1",
    });
    if (overrides.markAvailable) {
      reservation.markAsAvailable();
    }
    if (overrides.markFulfilled) {
      reservation.markAsAvailable();
      reservation.fulfill();
    }
    if (overrides.markCancelled) {
      reservation.cancel();
    }
    await reservationRepository.save(reservation);
    return reservation;
  }

  it("retorna las reservas PENDING del usuario", async () => {
    const { reservationRepository, listMyReservations } = setup();
    const own = await createReservation(reservationRepository, {
      userId: "user-1",
    });

    const result = await listMyReservations.execute({ userId: "user-1" });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(own.id);
    expect(result[0].status).toBe("PENDING");
  });

  it("retorna también las reservas AVAILABLE del usuario", async () => {
    const { reservationRepository, listMyReservations } = setup();
    const own = await createReservation(reservationRepository, {
      userId: "user-1",
      markAvailable: true,
    });

    const result = await listMyReservations.execute({ userId: "user-1" });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(own.id);
    expect(result[0].status).toBe("AVAILABLE");
  });

  it("excluye las reservas CANCELLED", async () => {
    const { reservationRepository, listMyReservations } = setup();
    await createReservation(reservationRepository, {
      userId: "user-1",
      bookId: "book-cancelada",
      markCancelled: true,
    });
    const activa = await createReservation(reservationRepository, {
      userId: "user-1",
      bookId: "book-activa",
    });

    const result = await listMyReservations.execute({ userId: "user-1" });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(activa.id);
  });

  it("excluye las reservas FULFILLED", async () => {
    const { reservationRepository, listMyReservations } = setup();
    await createReservation(reservationRepository, {
      userId: "user-1",
      bookId: "book-cumplida",
      markFulfilled: true,
    });

    const result = await listMyReservations.execute({ userId: "user-1" });

    expect(result).toEqual([]);
  });

  it("excluye las reservas de otros usuarios", async () => {
    const { reservationRepository, listMyReservations } = setup();
    const own = await createReservation(reservationRepository, {
      userId: "user-1",
    });
    await createReservation(reservationRepository, {
      userId: "user-2",
      bookId: "book-otro",
    });

    const result = await listMyReservations.execute({ userId: "user-1" });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(own.id);
  });

  it("retorna array vacío si el usuario no tiene reservas", async () => {
    const { listMyReservations } = setup();

    const result = await listMyReservations.execute({
      userId: "user-sin-reservas",
    });

    expect(result).toEqual([]);
  });

  it("mapea los campos de la reserva al output esperado", async () => {
    const { reservationRepository, listMyReservations } = setup();
    const reservation = await createReservation(reservationRepository, {
      userId: "user-1",
      bookId: "book-42",
    });

    const [result] = await listMyReservations.execute({ userId: "user-1" });

    expect(result).toEqual({
      id: reservation.id,
      bookId: "book-42",
      userId: "user-1",
      reservationDate: reservation.reservationDate,
      status: "PENDING",
    });
  });
});
