import { User } from "./User";

describe("User", () => {
  it("crea un usuario con rol MEMBER por defecto", () => {
    const user = User.create({
      name: "Ana",
      email: "ANA@Test.com",
      passwordHash: "hashed123",
    });

    expect(user.role).toBe("MEMBER");
    expect(user.email).toBe("ana@test.com");
  });

  it("permite crear un usuario con rol explícito", () => {
    const user = User.create({
      name: "Bruno",
      email: "bruno@test.com",
      passwordHash: "hashed123",
      role: "LIBRARIAN",
    });

    expect(user.role).toBe("LIBRARIAN");
  });

  it("no permite crear un usuario sin nombre", () => {
    expect(() =>
      User.create({ name: "  ", email: "a@a.com", passwordHash: "x" }),
    ).toThrow("Name is required");
  });

  it("no permite crear un usuario con email inválido", () => {
    expect(() =>
      User.create({ name: "Ana", email: "invalido", passwordHash: "x" }),
    ).toThrow("Invalid email");
  });

  it("isLibrarianOrAdmin devuelve true para LIBRARIAN y ADMIN", () => {
    const librarian = User.create({
      name: "L",
      email: "l@l.com",
      passwordHash: "x",
      role: "LIBRARIAN",
    });
    const admin = User.create({
      name: "A",
      email: "a@a.com",
      passwordHash: "x",
      role: "ADMIN",
    });
    const member = User.create({
      name: "M",
      email: "m@m.com",
      passwordHash: "x",
    });

    expect(librarian.isLibrarianOrAdmin()).toBe(true);
    expect(admin.isLibrarianOrAdmin()).toBe(true);
    expect(member.isLibrarianOrAdmin()).toBe(false);
  });
});
