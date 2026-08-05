import { Email } from "./Email";

describe("Email", () => {
  it("crea un Email válido y lo normaliza a minúsculas", () => {
    const email = Email.create("Ana@Test.COM");
    expect(email.value).toBe("ana@test.com");
  });

  it("rechaza un email sin @", () => {
    expect(() => Email.create("anatest.com")).toThrow("Invalid email");
  });

  it("rechaza un email sin dominio", () => {
    expect(() => Email.create("ana@")).toThrow("Invalid email");
  });

  it("rechaza un email vacío", () => {
    expect(() => Email.create("   ")).toThrow("Invalid email");
  });

  it("dos Email con el mismo valor son iguales", () => {
    const a = Email.create("ana@test.com");
    const b = Email.create("ANA@TEST.COM");
    expect(a.equals(b)).toBe(true);
  });
});
