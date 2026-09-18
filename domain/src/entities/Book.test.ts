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

  it("crea un libro con coverUrl valida y la expone en el getter", () => {
    const book = Book.create({
      ...validInput,
      coverUrl: "https://covers.example.com/clean-code.jpg",
    });
    expect(book.coverUrl).toBe("https://covers.example.com/clean-code.jpg");
  });

  it("crea un libro sin coverUrl y el getter devuelve undefined", () => {
    const book = Book.create(validInput);
    expect(book.coverUrl).toBeUndefined();
  });

  it("rechaza coverUrl con protocolo invalido", () => {
    expect(() =>
      Book.create({ ...validInput, coverUrl: "ftp://covers.example.com/x.jpg" }),
    ).toThrow("coverUrl must be a valid http(s) URL");
  });

  it("rechaza coverUrl con formato invalido", () => {
    expect(() =>
      Book.create({ ...validInput, coverUrl: "no-es-una-url" }),
    ).toThrow("coverUrl must be a valid http(s) URL");
  });

  it("updateDetails con coverUrl vacio limpia la portada", () => {
    const book = Book.create({
      ...validInput,
      coverUrl: "https://covers.example.com/clean-code.jpg",
    });
    book.updateDetails({ coverUrl: "" });
    expect(book.coverUrl).toBeUndefined();
  });

  it("updateDetails con coverUrl nueva la reemplaza", () => {
    const book = Book.create(validInput);
    book.updateDetails({ coverUrl: "https://covers.example.com/nuevo.jpg" });
    expect(book.coverUrl).toBe("https://covers.example.com/nuevo.jpg");
  });
});
