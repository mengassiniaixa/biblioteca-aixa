import request from "supertest";
import {
  authHeader,
  buildTestApp,
  createBook,
  seedLibrarian,
  seedMember,
  TestApp,
} from "./helpers/testApp";

describe("Stats HTTP integration", () => {
  let t: TestApp;

  beforeEach(() => {
    t = buildTestApp();
  });

  it("GET /stats/library sin token responde 401", async () => {
    const res = await request(t.app).get("/stats/library");
    expect(res.status).toBe(401);
  });

  it("GET /stats/library con rol MEMBER responde 403", async () => {
    const member = await seedMember(t);
    const res = await request(t.app)
      .get("/stats/library")
      .set(authHeader(member.token));

    expect(res.status).toBe(403);
  });

  it("GET /stats/library con LIBRARIAN devuelve totales", async () => {
    const librarian = await seedLibrarian(t);
    await createBook(t, librarian.token, { isbn: "9780441172719", title: "Dune" });
    await createBook(t, librarian.token, { isbn: "9780547928227", title: "El Hobbit" });
    await seedMember(t);
    await seedMember(t);

    const res = await request(t.app)
      .get("/stats/library")
      .set(authHeader(librarian.token));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      totalBooks: 2,
      activeLoans: 0,
      overdueLoans: 0,
      totalMembers: 2,
    });
  });
});
