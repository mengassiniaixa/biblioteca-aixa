import { GetBook } from "./GetBook";
import { InMemoryBookRepository } from "./__fakes__/InMemoryBookRepository";
import { Book } from "../../entities/Book";
import { BookNotFoundError } from "../../errors/BookNotFoundError";

describe("GetBook", () => {
  function setup() {
    const bookRepository = new InMemoryBookRepository();
    const getBook = new GetBook(bookRepository);
    return { bookRepository, getBook };
  }

  it("retorna el libro con todos los campos si existe", async () => {
    const { bookRepository, getBook } = setup();
    const book = Book.create({
      isbn: "9780441172719",
      title: "Dune",
      author: "Frank Herbert",
      category: "SciFi",
      totalCopies: 3,
    });
    await bookRepository.save(book);

    const result = await getBook.execute({ bookId: book.id });

    expect(result).toEqual({
      id: book.id,
      isbn: "9780441172719",
      title: "Dune",
      author: "Frank Herbert",
      category: "SciFi",
      totalCopies: 3,
      availableCopies: 3,
    });
  });

  it("lanza BookNotFoundError si el libro no existe", async () => {
    const { getBook } = setup();

    await expect(getBook.execute({ bookId: "no-existe" })).rejects.toThrow(
      BookNotFoundError,
    );
  });
});
