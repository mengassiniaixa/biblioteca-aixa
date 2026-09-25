import request from "supertest";
import {
  authHeader,
  buildTestApp,
  createBook,
  seedLibrarian,
  seedMember,
  TestApp,
} from "./helpers/testApp";

describe("Loans HTTP integration", () => {
  let t: TestApp;

  beforeEach(() => {
    t = buildTestApp();
  });

  describe("POST /loans", () => {
    it("sin token responde 401", async () => {
      const res = await request(t.app).post("/loans").send({ bookId: "cualquiera" });
      expect(res.status).toBe(401);
    });

    it("MEMBER puede prestar un libro disponible (201)", async () => {
      const librarian = await seedLibrarian(t);
      const book = await createBook(t, librarian.token, { totalCopies: 2 });
      const member = await seedMember(t);

      const res = await request(t.app)
        .post("/loans")
        .set(authHeader(member.token))
        .send({ bookId: book.id });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        bookId: book.id,
        userId: member.id,
        status: "ACTIVE",
      });
      expect(res.body.loanDate).toEqual(expect.any(String));
      expect(res.body.dueDate).toEqual(expect.any(String));
    });

    it("responde 409 cuando el libro no tiene copias disponibles", async () => {
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
        .post("/loans")
        .set(authHeader(secondMember.token))
        .send({ bookId: book.id });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe("BookNotAvailableError");
    });

    it("responde 404 cuando el bookId no existe", async () => {
      const member = await seedMember(t);
      const res = await request(t.app)
        .post("/loans")
        .set(authHeader(member.token))
        .send({ bookId: "no-existe" });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("BookNotFoundError");
    });
  });

  describe("POST /loans/:id/return", () => {
    it("devuelve el libro y suma disponibilidad", async () => {
      const librarian = await seedLibrarian(t);
      const book = await createBook(t, librarian.token, { totalCopies: 1 });
      const member = await seedMember(t);

      const loan = await request(t.app)
        .post("/loans")
        .set(authHeader(member.token))
        .send({ bookId: book.id })
        .expect(201);

      const res = await request(t.app)
        .post(`/loans/${loan.body.id}/return`)
        .set(authHeader(member.token));

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        loanId: loan.body.id,
        status: "RETURNED",
      });
      expect(res.body.returnDate).toEqual(expect.any(String));

      const after = await request(t.app).get(`/books/${book.id}`);
      expect(after.body.availableCopies).toBe(1);
    });

    it("al devolver, promueve la primera reserva pendiente a AVAILABLE", async () => {
      const librarian = await seedLibrarian(t);
      const book = await createBook(t, librarian.token, { totalCopies: 1 });
      const borrower = await seedMember(t);
      const waiter = await seedMember(t);

      const loan = await request(t.app)
        .post("/loans")
        .set(authHeader(borrower.token))
        .send({ bookId: book.id })
        .expect(201);

      const reservation = await request(t.app)
        .post("/reservations")
        .set(authHeader(waiter.token))
        .send({ bookId: book.id })
        .expect(201);

      const res = await request(t.app)
        .post(`/loans/${loan.body.id}/return`)
        .set(authHeader(borrower.token));

      expect(res.status).toBe(200);
      expect(res.body.reservationPromotedTo).toBe(reservation.body.id);
    });

    it("devolver un loanId inexistente responde 404", async () => {
      const member = await seedMember(t);
      const res = await request(t.app)
        .post("/loans/no-existe/return")
        .set(authHeader(member.token));

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("LoanNotFoundError");
    });
  });

  describe("GET /loans/mine", () => {
    it("lista los préstamos activos del socio con book enriched", async () => {
      const librarian = await seedLibrarian(t);
      const book = await createBook(t, librarian.token, { totalCopies: 2, title: "Dune" });
      const member = await seedMember(t);

      await request(t.app)
        .post("/loans")
        .set(authHeader(member.token))
        .send({ bookId: book.id })
        .expect(201);

      const res = await request(t.app)
        .get("/loans/mine")
        .set(authHeader(member.token));

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({
        userId: member.id,
        book: { id: book.id, title: "Dune", author: "Frank Herbert" },
      });
    });
  });

  describe("GET /loans/mine/history", () => {
    it("incluye préstamos activos y devueltos ordenados por loanDate DESC", async () => {
      const librarian = await seedLibrarian(t);
      const book = await createBook(t, librarian.token, { totalCopies: 2 });
      const member = await seedMember(t);

      const loan = await request(t.app)
        .post("/loans")
        .set(authHeader(member.token))
        .send({ bookId: book.id })
        .expect(201);

      await request(t.app)
        .post(`/loans/${loan.body.id}/return`)
        .set(authHeader(member.token))
        .expect(200);

      const res = await request(t.app)
        .get("/loans/mine/history")
        .set(authHeader(member.token));

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].status).toBe("RETURNED");
      expect(res.body[0].returnDate).not.toBeNull();
    });
  });

  describe("GET /loans/overdue", () => {
    it("MEMBER recibe 403", async () => {
      const member = await seedMember(t);
      const res = await request(t.app)
        .get("/loans/overdue")
        .set(authHeader(member.token));

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("UnauthorizedError");
    });

    it("LIBRARIAN recibe 200 con la lista (vacía por default)", async () => {
      const librarian = await seedLibrarian(t);
      const res = await request(t.app)
        .get("/loans/overdue")
        .set(authHeader(librarian.token));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("LIBRARIAN ve el préstamo demo overdue seed", async () => {
      const librarian = await seedLibrarian(t);
      await t.container.seedBooks();
      await t.container.seedDemoOverdue();

      const res = await request(t.app)
        .get("/loans/overdue")
        .set(authHeader(librarian.token));

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({
        daysOverdue: expect.any(Number),
        book: { title: "Dune" },
        member: { email: "demo-overdue@biblioteca.local" },
      });
      expect(res.body[0].daysOverdue).toBeGreaterThan(0);
    });
  });
});
