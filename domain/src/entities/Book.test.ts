import { Book } from "./Book";

describe("Book", () => {
  const validInput = {
    isbn: "978-3-16-148410-0",
    title: "Clean Code",
    author: "Robert C. Martin",
    category: "Tech",
    totalCopies: 3,
  };

  it("crea un libro válido con availableCopies igual a totalCopies", () => {
    const book = Book.create(validInput);

    expect(book.title).toBe("Clean Code");
    expect(book.availableCopies).toBe(3);
    expect(book.totalCopies).toBe(3);
  });

  it("no permite crear un libro sin título", () => {
    expect(() => Book.create({ ...validInput, title: "  " })).toThrow(
      "Title is required",
    );
  });

  it("no permite crear un libro con totalCopies <= 0", () => {
    expect(() => Book.create({ ...validInput, totalCopies: 0 })).toThrow(
      "totalCopies must be > 0",
    );
  });

  it("decreaseAvailability reduce las copias disponibles en 1", () => {
    const book = Book.create(validInput);
    book.decreaseAvailability();
    expect(book.availableCopies).toBe(2);
  });

  it("no permite decreaseAvailability si no hay copias disponibles", () => {
    const book = Book.create({ ...validInput, totalCopies: 1 });
    book.decreaseAvailability();
    expect(() => book.decreaseAvailability()).toThrow(
      "No available copies to loan",
    );
  });

  it("increaseAvailability aumenta las copias disponibles en 1", () => {
    const book = Book.create(validInput);
    book.decreaseAvailability();
    book.increaseAvailability();
    expect(book.availableCopies).toBe(3);
  });

  it("no permite increaseAvailability por encima de totalCopies", () => {
    const book = Book.create(validInput);
    expect(() => book.increaseAvailability()).toThrow(
      "Cannot exceed totalCopies",
    );
  });

  it("hasAvailableCopies devuelve false cuando no quedan copias", () => {
    const book = Book.create({ ...validInput, totalCopies: 1 });
    book.decreaseAvailability();
    expect(book.hasAvailableCopies()).toBe(false);
  });
});
