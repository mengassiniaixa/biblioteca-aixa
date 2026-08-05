import { ISBN } from "./ISBN";

describe("ISBN", () => {
  it("crea un ISBN-13 válido (con guiones)", () => {
    const isbn = ISBN.create("978-3-16-148410-0");
    expect(isbn.value).toBe("9783161484100");
  });

  it("crea un ISBN-13 válido (sin guiones)", () => {
    const isbn = ISBN.create("9783161484100");
    expect(isbn.value).toBe("9783161484100");
  });

  it("rechaza un ISBN con longitud incorrecta", () => {
    expect(() => ISBN.create("12345")).toThrow("Invalid ISBN");
  });

  it("rechaza un ISBN con letras", () => {
    expect(() => ISBN.create("978-3-16-14841X-0")).toThrow("Invalid ISBN");
  });

  it("dos ISBN con el mismo valor son iguales", () => {
    const a = ISBN.create("978-3-16-148410-0");
    const b = ISBN.create("9783161484100");
    expect(a.equals(b)).toBe(true);
  });
});
