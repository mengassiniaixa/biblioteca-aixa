import { SearchBooks } from "./SearchBooks";
import { InMemoryBookRepository } from "./__fakes__/InMemoryBookRepository";
import { Book } from "../../entities/Book";

describe("SearchBooks", () => {
  function setup() {
    const bookRepository = new InMemoryBookRepository();
    const searchBooks = new SearchBooks(bookRepository);
    return { bookRepository, searchBooks };
  }

  async function seed(bookRepository: InMemoryBookRepository) {
    const cleanCode = Book.create({
      isbn: "9780132350884",
      title: "Clean Code",
      author: "Robert C. Martin",
      category: "Tech",
      totalCopies: 3,
    });
    const cleanArch = Book.create({
      isbn: "9780134494166",
      title: "Clean Architecture",
      author: "Robert C. Martin",
      category: "Tech",
      totalCopies: 2,
    });
    const rayuela = Book.create({
      isbn: "9788437604572",
      title: "Rayuela",
      author: "Julio Cortázar",
      category: "Fiction",
      totalCopies: 1,
    });
    await bookRepository.save(cleanCode);
    await bookRepository.save(cleanArch);
    await bookRepository.save(rayuela);
    return { cleanCode, cleanArch, rayuela };
  }

  it("retorna todos los libros cuando no hay filtros", async () => {
    const { bookRepository, searchBooks } = setup();
    await seed(bookRepository);

    const result = await searchBooks.execute({});

    expect(result).toHaveLength(3);
  });

  it("filtra por título (match parcial, case-insensitive)", async () => {
    const { bookRepository, searchBooks } = setup();
    await seed(bookRepository);

    const result = await searchBooks.execute({ title: "clean" });

    expect(result).toHaveLength(2);
    expect(result.map((b) => b.title).sort()).toEqual([
      "Clean Architecture",
      "Clean Code",
    ]);
  });

  it("filtra por autor (match parcial, case-insensitive)", async () => {
    const { bookRepository, searchBooks } = setup();
    await seed(bookRepository);

    const result = await searchBooks.execute({ author: "cortázar" });

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Rayuela");
  });

  it("filtra por categoría (match exacto, case-insensitive)", async () => {
    const { bookRepository, searchBooks } = setup();
    await seed(bookRepository);

    const result = await searchBooks.execute({ category: "tech" });

    expect(result).toHaveLength(2);
    expect(result.every((b) => b.category === "Tech")).toBe(true);
  });

  it("combina múltiples filtros", async () => {
    const { bookRepository, searchBooks } = setup();
    await seed(bookRepository);

    const result = await searchBooks.execute({
      title: "clean",
      author: "martin",
      category: "Tech",
    });

    expect(result).toHaveLength(2);
  });

  it("retorna array vacío cuando ningún libro matchea", async () => {
    const { bookRepository, searchBooks } = setup();
    await seed(bookRepository);

    const result = await searchBooks.execute({ title: "no-existe" });

    expect(result).toEqual([]);
  });

  it("retorna array vacío cuando el repositorio está vacío", async () => {
    const { searchBooks } = setup();

    const result = await searchBooks.execute({});

    expect(result).toEqual([]);
  });

  it("mapea los campos del libro al output esperado", async () => {
    const { bookRepository, searchBooks } = setup();
    await seed(bookRepository);

    const result = await searchBooks.execute({ title: "Rayuela" });

    expect(result[0]).toEqual({
      id: expect.any(String),
      isbn: "9788437604572",
      title: "Rayuela",
      author: "Julio Cortázar",
      category: "Fiction",
      totalCopies: 1,
      availableCopies: 1,
    });
  });
});
