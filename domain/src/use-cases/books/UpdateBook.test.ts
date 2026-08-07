import { UpdateBook } from "./UpdateBook";
import { InMemoryBookRepository } from "./__fakes__/InMemoryBookRepository";
import { InMemoryUserRepository } from "./__fakes__/InMemoryUserRepository";
import { Book } from "../../entities/Book";
import { User } from "../../entities/User";
import { UserNotFoundError } from "../../errors/UserNotFoundError";
import { UnauthorizedError } from "../../errors/UnauthorizedError";
import { BookNotFoundError } from "../../errors/BookNotFoundError";

describe("UpdateBook", () => {
  function setup() {
    const bookRepository = new InMemoryBookRepository();
    const userRepository = new InMemoryUserRepository();
    const updateBook = new UpdateBook(bookRepository, userRepository);
    return { bookRepository, userRepository, updateBook };
  }

  async function createActor(
    userRepository: InMemoryUserRepository,
    role: "MEMBER" | "LIBRARIAN" | "ADMIN" = "LIBRARIAN",
  ) {
    const actor = User.create({
      name: "Actor",
      email: `actor-${role.toLowerCase()}@test.com`,
      passwordHash: "hash",
      role,
    });
    await userRepository.save(actor);
    return actor;
  }

  async function createBookInRepo(
    bookRepository: InMemoryBookRepository,
    overrides: Partial<{
      isbn: string;
      title: string;
      author: string;
      category: string;
      totalCopies: number;
    }> = {},
  ) {
    const book = Book.create({
      isbn: "9783161484100",
      title: "Clean Code",
      author: "R. Martin",
      category: "Tech",
      totalCopies: 3,
      ...overrides,
    });
    await bookRepository.save(book);
    return book;
  }

  it("actualiza el libro cuando el actor es LIBRARIAN", async () => {
    const { bookRepository, userRepository, updateBook } = setup();
    const actor = await createActor(userRepository, "LIBRARIAN");
    const book = await createBookInRepo(bookRepository);

    const result = await updateBook.execute({
      actorId: actor.id,
      bookId: book.id,
      title: "Clean Code (2nd ed.)",
      author: "Robert C. Martin",
      category: "Software",
    });

    expect(result.title).toBe("Clean Code (2nd ed.)");
    expect(result.author).toBe("Robert C. Martin");
    expect(result.category).toBe("Software");

    const saved = await bookRepository.findById(book.id);
    expect(saved?.title).toBe("Clean Code (2nd ed.)");
  });

  it("actualiza el libro cuando el actor es ADMIN", async () => {
    const { bookRepository, userRepository, updateBook } = setup();
    const actor = await createActor(userRepository, "ADMIN");
    const book = await createBookInRepo(bookRepository);

    const result = await updateBook.execute({
      actorId: actor.id,
      bookId: book.id,
      title: "Nuevo título",
    });

    expect(result.title).toBe("Nuevo título");
  });

  it("actualiza solo los campos especificados y deja el resto igual", async () => {
    const { bookRepository, userRepository, updateBook } = setup();
    const actor = await createActor(userRepository, "LIBRARIAN");
    const book = await createBookInRepo(bookRepository);

    const result = await updateBook.execute({
      actorId: actor.id,
      bookId: book.id,
      title: "Otro título",
    });

    expect(result.title).toBe("Otro título");
    expect(result.author).toBe("R. Martin");
    expect(result.category).toBe("Tech");
    expect(result.totalCopies).toBe(3);
  });

  it("actualiza totalCopies y recalcula availableCopies preservando los prestados", async () => {
    const { bookRepository, userRepository, updateBook } = setup();
    const actor = await createActor(userRepository, "LIBRARIAN");
    const book = await createBookInRepo(bookRepository, { totalCopies: 3 });
    book.decreaseAvailability();
    await bookRepository.save(book);

    const result = await updateBook.execute({
      actorId: actor.id,
      bookId: book.id,
      totalCopies: 5,
    });

    expect(result.totalCopies).toBe(5);
    expect(result.availableCopies).toBe(4);
  });

  it("lanza UserNotFoundError si el actor no existe", async () => {
    const { bookRepository, updateBook } = setup();
    const book = await createBookInRepo(bookRepository);

    await expect(
      updateBook.execute({
        actorId: "no-existe",
        bookId: book.id,
        title: "X",
      }),
    ).rejects.toThrow(UserNotFoundError);
  });

  it("lanza UnauthorizedError si el actor es MEMBER", async () => {
    const { bookRepository, userRepository, updateBook } = setup();
    const actor = await createActor(userRepository, "MEMBER");
    const book = await createBookInRepo(bookRepository);

    await expect(
      updateBook.execute({
        actorId: actor.id,
        bookId: book.id,
        title: "X",
      }),
    ).rejects.toThrow(UnauthorizedError);
  });

  it("lanza BookNotFoundError si el libro no existe", async () => {
    const { userRepository, updateBook } = setup();
    const actor = await createActor(userRepository, "LIBRARIAN");

    await expect(
      updateBook.execute({
        actorId: actor.id,
        bookId: "no-existe",
        title: "X",
      }),
    ).rejects.toThrow(BookNotFoundError);
  });
});
