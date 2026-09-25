import request from "supertest";
import {
  authHeader,
  buildTestApp,
  createBook,
  seedLibrarian,
  seedMember,
  TestApp,
} from "./helpers/testApp";

describe("Reservations HTTP integration", () => {
  let t: TestApp;

  beforeEach(() => {
    t = buildTestApp();
  });

  describe("POST /reservations", () => {
    it("sin token responde 401", async () => {
      const res = await request(t.app)
        .post("/reservations")
        .send({ bookId: "cualquiera" });
      expect(res.status).toBe(401);
    });

    it("MEMBER puede reservar un libro sin copias disponibles (201)", async () => {
      const librarian = await seedLibrarian(t);
      const book = await createBook(t, librarian.token, { totalCopies: 1 });
      const firstMember = await seedMember(t);
      const secondMember = await seedMember(t);

      await request(t.app)
        .post("/loans")
        .set(authHeader(firstMember.token))
        .send({ bookId: book.id })
        .expect(201);

      const res = await request(t.app)
        .post("/reservations")
        .set(authHeader(secondMember.token))
        .send({ bookId: book.id });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        bookId: book.id,
        userId: secondMember.id,
        status: "PENDING",
      });
    });

    it("responde 409 al reservar dos veces el mismo libro con el mismo socio", async () => {
      const librarian = await seedLibrarian(t);
      const book = await createBook(t, librarian.token, { totalCopies: 1 });
      const borrower = await seedMember(t);
      const waiter = await seedMember(t);

      await request(t.app)
        .post("/loans")
        .set(authHeader(borrower.token))
        .send({ bookId: book.id })
        .expect(201);

      await request(t.app)
        .post("/reservations")
        .set(authHeader(waiter.token))
        .send({ bookId: book.id })
        .expect(201);

      const res = await request(t.app)
        .post("/reservations")
        .set(authHeader(waiter.token))
        .send({ bookId: book.id });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe("ReservationAlreadyExistsError");
    });
  });

  describe("GET /reservations/mine", () => {
    it("devuelve las reservas activas del socio con book enriched", async () => {
      const librarian = await seedLibrarian(t);
      const book = await createBook(t, librarian.token, { totalCopies: 1, title: "Dune" });
      const firstMember = await seedMember(t);
      const secondMember = await seedMember(t);

      await request(t.app)
        .post("/loans")
        .set(authHeader(firstMember.token))
        .send({ bookId: book.id })
        .expect(201);

      await request(t.app)
        .post("/reservations")
        .set(authHeader(secondMember.token))
        .send({ bookId: book.id })
        .expect(201);

      const res = await request(t.app)
        .get("/reservations/mine")
        .set(authHeader(secondMember.token));

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({
        userId: secondMember.id,
        book: { id: book.id, title: "Dune" },
      });
    });
  });

  describe("POST /reservations/:id/cancel", () => {
    it("el dueño puede cancelar su reserva", async () => {
      const librarian = await seedLibrarian(t);
      const book = await createBook(t, librarian.token, { totalCopies: 1 });
      const firstMember = await seedMember(t);
      const secondMember = await seedMember(t);

      await request(t.app)
        .post("/loans")
        .set(authHeader(firstMember.token))
        .send({ bookId: book.id })
        .expect(201);

      const reservation = await request(t.app)
        .post("/reservations")
        .set(authHeader(secondMember.token))
        .send({ bookId: book.id })
        .expect(201);

      const res = await request(t.app)
        .post(`/reservations/${reservation.body.id}/cancel`)
        .set(authHeader(secondMember.token));

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("CANCELLED");
    });

    it("cancelar una reserva inexistente responde 404", async () => {
      const member = await seedMember(t);
      const res = await request(t.app)
        .post("/reservations/no-existe/cancel")
        .set(authHeader(member.token));

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("ReservationNotFoundError");
    });
  });
});
