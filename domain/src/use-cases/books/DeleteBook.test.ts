import { DeleteBook } from "./DeleteBook";
import { InMemoryBookRepository } from "./__fakes__/InMemoryBookRepository";
import { InMemoryUserRepository } from "./__fakes__/InMemoryUserRepository";
import { Book } from "../../entities/Book";
import { User } from "../../entities/User";
import { UserNotFoundError } from "../../errors/UserNotFoundError";
import { UnauthorizedError } from "../../errors/UnauthorizedError";
import { BookNotFoundError } from "../../errors/BookNotFoundError";
import { BookHasActiveLoansError } from "../../errors/BookHasActiveLoansError";

describe("DeleteBook", () => {
  function setup() {
    const bookRepository = new InMemoryBookRepository();
    const userRepository = new InMemoryUserRepository();
    const deleteBook = new DeleteBook(bookRepository, userRepository);
    return { bookRepository, userRepository, deleteBook };
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

  async function createBookInRepo(bookRepository: InMemoryBookRepository) {
    const book = Book.create({
      isbn: "9783161484100",
      title: "Clean Code",
      author: "R. Martin",
      category: "Tech",
      totalCopies: 3,
    });
    await bookRepository.save(book);
    return book;
  }

  it("elimina el libro cuando el actor es LIBRARIAN", async () => {
    const { bookRepository, userRepository, deleteBook } = setup();
    const actor = await createActor(userRepository, "LIBRARIAN");
    const book = await createBookInRepo(bookRepository);

    await deleteBook.execute({ actorId: actor.id, bookId: book.id });

    const found = await bookRepository.findById(book.id);
    expect(found).toBeNull();
  });

  it("elimina el libro cuando el actor es ADMIN", async () => {
    const { bookRepository, userRepository, deleteBook } = setup();
    const actor = await createActor(userRepository, "ADMIN");
    const book = await createBookInRepo(bookRepository);

    await deleteBook.execute({ actorId: actor.id, bookId: book.id });

    const found = await bookRepository.findById(book.id);
    expect(found).toBeNull();
  });

  it("lanza UserNotFoundError si el actor no existe", async () => {
    const { bookRepository, deleteBook } = setup();
    const book = await createBookInRepo(bookRepository);

    await expect(
      deleteBook.execute({ actorId: "no-existe", bookId: book.id }),
    ).rejects.toThrow(UserNotFoundError);
  });

  it("lanza UnauthorizedError si el actor es MEMBER", async () => {
    const { bookRepository, userRepository, deleteBook } = setup();
    const actor = await createActor(userRepository, "MEMBER");
    const book = await createBookInRepo(bookRepository);

    await expect(
      deleteBook.execute({ actorId: actor.id, bookId: book.id }),
    ).rejects.toThrow(UnauthorizedError);
  });

  it("lanza BookNotFoundError si el libro no existe", async () => {
    const { userRepository, deleteBook } = setup();
    const actor = await createActor(userRepository, "LIBRARIAN");

    await expect(
      deleteBook.execute({ actorId: actor.id, bookId: "no-existe" }),
    ).rejects.toThrow(BookNotFoundError);
  });

  it("lanza BookHasActiveLoansError si el libro tiene copias prestadas", async () => {
    const { bookRepository, userRepository, deleteBook } = setup();
    const actor = await createActor(userRepository, "LIBRARIAN");
    const book = await createBookInRepo(bookRepository);
    book.decreaseAvailability();
    await bookRepository.save(book);

    await expect(
      deleteBook.execute({ actorId: actor.id, bookId: book.id }),
    ).rejects.toThrow(BookHasActiveLoansError);

    const stillThere = await bookRepository.findById(book.id);
    expect(stillThere).not.toBeNull();
  });
});
