import request from "supertest";
import { buildTestApp, seedMember, TestApp } from "./helpers/testApp";

describe("Auth HTTP integration", () => {
  let t: TestApp;

  beforeEach(() => {
    t = buildTestApp();
  });

  describe("POST /auth/register", () => {
    it("crea un MEMBER y devuelve 201 con id/email/role", async () => {
      const res = await request(t.app)
        .post("/auth/register")
        .send({ name: "Ada Lovelace", email: "ada@test.local", password: "secret123" });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        name: "Ada Lovelace",
        email: "ada@test.local",
        role: "MEMBER",
      });
      expect(res.body.id).toEqual(expect.any(String));
      expect(res.body).not.toHaveProperty("passwordHash");
    });

    it("responde 400 cuando el body es inválido (zod)", async () => {
      const res = await request(t.app)
        .post("/auth/register")
        .send({ name: "", email: "no-es-email", password: "123" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("ValidationError");
      expect(Array.isArray(res.body.details)).toBe(true);
    });

    it("responde 409 cuando el email ya está en uso", async () => {
      await seedMember(t, { email: "duplicado@test.local" });

      const res = await request(t.app)
        .post("/auth/register")
        .send({ name: "Otro", email: "duplicado@test.local", password: "otrosecret" });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe("EmailAlreadyInUseError");
    });
  });

  describe("POST /auth/login", () => {
    it("devuelve un token JWT válido con credenciales correctas", async () => {
      const member = await seedMember(t, { email: "login@test.local", password: "correct123" });

      const res = await request(t.app)
        .post("/auth/login")
        .send({ email: member.email, password: "correct123" });

      expect(res.status).toBe(200);
      expect(res.body.token).toEqual(expect.any(String));
      const payload = t.container.tokenService.verify(res.body.token);
      expect(payload.userId).toBe(member.id);
      expect(payload.role).toBe("MEMBER");
    });

    it("responde 401 con credenciales inválidas", async () => {
      await seedMember(t, { email: "bad@test.local", password: "correct123" });

      const res = await request(t.app)
        .post("/auth/login")
        .send({ email: "bad@test.local", password: "wrong-password" });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("InvalidCredentialsError");
    });

    it("responde 401 cuando el email no existe", async () => {
      const res = await request(t.app)
        .post("/auth/login")
        .send({ email: "no-existe@test.local", password: "cualquiera" });

      expect(res.status).toBe(401);
    });
  });
});
