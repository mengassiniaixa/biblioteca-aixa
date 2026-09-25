import request from "supertest";
import {
  authHeader,
  buildTestApp,
  createBook,
  seedLibrarian,
  seedMember,
  TestApp,
} from "./helpers/testApp";

describe("Books HTTP integration", () => {
  let t: TestApp;

  beforeEach(() => {
    t = buildTestApp();
  });

  describe("rutas públicas", () => {
    it("GET /books devuelve el catálogo sin auth", async () => {
      const librarian = await seedLibrarian(t);
      await createBook(t, librarian.token, { isbn: "9780441172719", title: "Dune" });
      await createBook(t, librarian.token, {
        isbn: "9780547928227",
        title: "El Hobbit",
        author: "J.R.R. Tolkien",
      });

      const res = await request(t.app).get("/books");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body.map((b: { title: string }) => b.title)).toEqual(
        expect.arrayContaining(["Dune", "El Hobbit"]),
      );
    });

    it("GET /books/:id devuelve el libro cuando existe", async () => {
      const librarian = await seedLibrarian(t);
      const book = await createBook(t, librarian.token);

      const res = await request(t.app).get(`/books/${book.id}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: book.id, title: "Dune", author: "Frank Herbert" });
    });

    it("GET /books/:id devuelve 404 cuando no existe", async () => {
      const res = await request(t.app).get("/books/no-existe-id");

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("BookNotFoundError");
    });
  });

  describe("rutas protegidas de escritura", () => {
    it("POST /books sin token responde 401", async () => {
      const res = await request(t.app)
        .post("/books")
        .send({ isbn: "9780441172719", title: "X", author: "Y", category: "Z", totalCopies: 1 });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("InvalidCredentialsError");
    });

    it("POST /books con rol MEMBER responde 403", async () => {
      const member = await seedMember(t);

      const res = await request(t.app)
        .post("/books")
        .set(authHeader(member.token))
        .send({
          isbn: "9780441172719",
          title: "Dune",
          author: "Frank Herbert",
          category: "SciFi",
          totalCopies: 2,
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("UnauthorizedError");
    });

    it("POST /books con LIBRARIAN crea el libro y devuelve 201", async () => {
      const librarian = await seedLibrarian(t);

      const res = await request(t.app)
        .post("/books")
        .set(authHeader(librarian.token))
        .send({
          isbn: "9780441172719",
          title: "Dune",
          author: "Frank Herbert",
          category: "SciFi",
          totalCopies: 3,
        });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        title: "Dune",
        totalCopies: 3,
        availableCopies: 3,
      });
    });

    it("POST /books con ISBN duplicado responde 409", async () => {
      const librarian = await seedLibrarian(t);
      await createBook(t, librarian.token, { isbn: "9780441172719" });

      const res = await request(t.app)
        .post("/books")
        .set(authHeader(librarian.token))
        .send({
          isbn: "9780441172719",
          title: "Otro Dune",
          author: "Otro",
          category: "SciFi",
          totalCopies: 1,
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe("BookAlreadyExistsError");
    });

    it("PUT /books/:id con LIBRARIAN actualiza el título", async () => {
      const librarian = await seedLibrarian(t);
      const book = await createBook(t, librarian.token);

      const res = await request(t.app)
        .put(`/books/${book.id}`)
        .set(authHeader(librarian.token))
        .send({ title: "Dune — edición extendida" });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe("Dune — edición extendida");
    });

    it("DELETE /books/:id con LIBRARIAN responde 204", async () => {
      const librarian = await seedLibrarian(t);
      const book = await createBook(t, librarian.token);

      const res = await request(t.app)
        .delete(`/books/${book.id}`)
        .set(authHeader(librarian.token));

      expect(res.status).toBe(204);
      const after = await request(t.app).get(`/books/${book.id}`);
      expect(after.status).toBe(404);
    });
  });

  describe("validación del body", () => {
    it("POST /books con body inválido responde 400", async () => {
      const librarian = await seedLibrarian(t);

      const res = await request(t.app)
        .post("/books")
        .set(authHeader(librarian.token))
        .send({ isbn: "", title: "X", author: "Y", category: "Z", totalCopies: -1 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("ValidationError");
    });
  });
});
