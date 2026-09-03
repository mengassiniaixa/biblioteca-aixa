import { ListMyReservations } from "./ListMyReservations";
import { InMemoryReservationRepository } from "./__fakes__/InMemoryReservationRepository";
import { InMemoryBookRepository } from "./__fakes__/InMemoryBookRepository";
import { Reservation } from "../../entities/Reservation";
import { Book } from "../../entities/Book";
import { ISBN } from "../../value-objects/ISBN";

describe("ListMyReservations", () => {
  function setup() {
    const reservationRepository = new InMemoryReservationRepository();
    const bookRepository = new InMemoryBookRepository();
    const listMyReservations = new ListMyReservations(
      reservationRepository,
      bookRepository,
    );
    return { reservationRepository, bookRepository, listMyReservations };
  }

  async function createBook(
    bookRepository: InMemoryBookRepository,
    overrides: Partial<{ id: string; title: string; author: string; isbn: string }> = {},
  ) {
    const book = Book.reconstitute({
      id: overrides.id ?? "book-1",
      isbn: ISBN.create(overrides.isbn ?? "9780553380163"),
      title: overrides.title ?? "Dune",
      author: overrides.author ?? "Herbert",
      category: "SciFi",
      totalCopies: 3,
      availableCopies: 0,
    });
    await bookRepository.save(book);
    return book;
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

  it("retorna las reservas PENDING del usuario enriquecidas con book", async () => {
    const { reservationRepository, bookRepository, listMyReservations } = setup();
    await createBook(bookRepository, { title: "Dune" });
    const own = await createReservation(reservationRepository, {
      userId: "user-1",
    });

    const result = await listMyReservations.execute({ userId: "user-1" });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(own.id);
    expect(result[0].status).toBe("PENDING");
    expect(result[0].book.title).toBe("Dune");
  });

  it("retorna también las reservas AVAILABLE del usuario", async () => {
    const { reservationRepository, bookRepository, listMyReservations } = setup();
    await createBook(bookRepository);
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
    const { reservationRepository, bookRepository, listMyReservations } = setup();
    await createBook(bookRepository, { id: "book-cancelada", isbn: "9780618640157" });
    await createBook(bookRepository, { id: "book-activa", isbn: "9780132350884" });
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
    const { reservationRepository, bookRepository, listMyReservations } = setup();
    await createBook(bookRepository, { id: "book-cumplida" });
    await createReservation(reservationRepository, {
      userId: "user-1",
      bookId: "book-cumplida",
      markFulfilled: true,
    });

    const result = await listMyReservations.execute({ userId: "user-1" });

    expect(result).toEqual([]);
  });

  it("excluye las reservas de otros usuarios", async () => {
    const { reservationRepository, bookRepository, listMyReservations } = setup();
    await createBook(bookRepository, { id: "book-1" });
    await createBook(bookRepository, { id: "book-otro", isbn: "9780618640157" });
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

  it("filtra silenciosamente las reservas cuyo book fue eliminado", async () => {
    const { reservationRepository, bookRepository, listMyReservations } = setup();
    await createBook(bookRepository, { id: "book-1" });
    await createReservation(reservationRepository, {
      userId: "user-1",
      bookId: "book-1",
    });
    await createReservation(reservationRepository, {
      userId: "user-1",
      bookId: "book-fantasma",
    });

    const result = await listMyReservations.execute({ userId: "user-1" });

    expect(result).toHaveLength(1);
    expect(result[0].book.id).toBe("book-1");
  });

  it("retorna array vacío si el usuario no tiene reservas", async () => {
    const { listMyReservations } = setup();

    const result = await listMyReservations.execute({
      userId: "user-sin-reservas",
    });

    expect(result).toEqual([]);
  });

  it("mapea los campos de la reserva al output esperado", async () => {
    const { reservationRepository, bookRepository, listMyReservations } = setup();
    const book = await createBook(bookRepository, {
      id: "book-42",
      title: "Neuromancer",
      author: "Gibson",
      isbn: "9780441569595",
    });
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
      book: {
        id: book.id,
        title: "Neuromancer",
        author: "Gibson",
        isbn: book.isbn,
      },
    });
  });
});
