import type { Express } from "express";
import request from "supertest";
import { buildApp } from "../../app";
import { buildContainer, Container } from "../../composition/container";

export interface TestApp {
  app: Express;
  container: Container;
}

export function buildTestApp(): TestApp {
  const container = buildContainer({
    jwtSecret: "test-secret",
    jwtExpiresIn: "1h",
    repositoryMode: "memory",
    databaseUrl: null,
  });
  const app = buildApp(container);
  return { app, container };
}

interface SeededUser {
  id: string;
  email: string;
  password: string;
  token: string;
  role: "MEMBER" | "LIBRARIAN" | "ADMIN";
}

export async function seedLibrarian(t: TestApp): Promise<SeededUser> {
  const email = `librarian-${Date.now()}-${Math.random().toString(36).slice(2)}@test.local`;
  const password = "librarian123";
  await t.container.seedLibrarian({ name: "Bibliotecaria Test", email, password });

  const login = await request(t.app)
    .post("/auth/login")
    .send({ email, password })
    .expect(200);

  const payload = t.container.tokenService.verify(login.body.token);
  return {
    id: payload.userId,
    email,
    password,
    token: login.body.token,
    role: "LIBRARIAN",
  };
}

export async function seedMember(
  t: TestApp,
  overrides: Partial<{ name: string; email: string; password: string }> = {},
): Promise<SeededUser> {
  const email =
    overrides.email ??
    `member-${Date.now()}-${Math.random().toString(36).slice(2)}@test.local`;
  const password = overrides.password ?? "member123";
  const name = overrides.name ?? "Socio Test";

  const register = await request(t.app)
    .post("/auth/register")
    .send({ name, email, password })
    .expect(201);

  const login = await request(t.app)
    .post("/auth/login")
    .send({ email, password })
    .expect(200);

  return {
    id: register.body.id,
    email,
    password,
    token: login.body.token,
    role: "MEMBER",
  };
}

export interface CreatedBook {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
}

export async function createBook(
  t: TestApp,
  librarianToken: string,
  overrides: Partial<{
    isbn: string;
    title: string;
    author: string;
    category: string;
    totalCopies: number;
    coverUrl: string;
  }> = {},
): Promise<CreatedBook> {
  const body = {
    isbn: overrides.isbn ?? "9780441172719",
    title: overrides.title ?? "Dune",
    author: overrides.author ?? "Frank Herbert",
    category: overrides.category ?? "SciFi",
    totalCopies: overrides.totalCopies ?? 2,
    ...(overrides.coverUrl ? { coverUrl: overrides.coverUrl } : {}),
  };
  const res = await request(t.app)
    .post("/books")
    .set("Authorization", `Bearer ${librarianToken}`)
    .send(body)
    .expect(201);
  return res.body as CreatedBook;
}

export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}
