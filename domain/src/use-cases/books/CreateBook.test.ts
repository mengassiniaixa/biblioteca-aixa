import { CreateBook } from "./CreateBook";
import { InMemoryBookRepository } from "./__fakes__/InMemoryBookRepository";
import { InMemoryUserRepository } from "./__fakes__/InMemoryUserRepository";
import { User } from "../../entities/User";
import { UserNotFoundError } from "../../errors/UserNotFoundError";
import { UnauthorizedError } from "../../errors/UnauthorizedError";
import { BookAlreadyExistsError } from "../../errors/BookAlreadyExistsError";

describe("CreateBook", () => {
  function setup() {
    const bookRepository = new InMemoryBookRepository();
    const userRepository = new InMemoryUserRepository();
    const createBook = new CreateBook(bookRepository, userRepository);
    return { bookRepository, userRepository, createBook };
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

  const validInput = {
    isbn: "9783161484100",
    title: "Clean Code",
    author: "R. Martin",
    category: "Tech",
    totalCopies: 3,
  };

  it("crea un libro cuando el actor es LIBRARIAN", async () => {
    const { bookRepository, userRepository, createBook } = setup();
    const actor = await createActor(userRepository, "LIBRARIAN");

    const result = await createBook.execute({
      actorId: actor.id,
      ...validInput,
    });

    expect(result.title).toBe("Clean Code");
    expect(result.totalCopies).toBe(3);
    expect(result.availableCopies).toBe(3);

    const saved = await bookRepository.findById(result.id);
    expect(saved).not.toBeNull();
    expect(saved?.isbn).toBe("9783161484100");
  });

  it("crea un libro cuando el actor es ADMIN", async () => {
    const { userRepository, createBook } = setup();
    const actor = await createActor(userRepository, "ADMIN");

    const result = await createBook.execute({
      actorId: actor.id,
      ...validInput,
    });

    expect(result.id).toBeDefined();
  });

  it("lanza UserNotFoundError si el actor no existe", async () => {
    const { createBook } = setup();

    await expect(
      createBook.execute({ actorId: "no-existe", ...validInput }),
    ).rejects.toThrow(UserNotFoundError);
  });

  it("lanza UnauthorizedError si el actor es MEMBER", async () => {
    const { userRepository, createBook } = setup();
    const actor = await createActor(userRepository, "MEMBER");

    await expect(
      createBook.execute({ actorId: actor.id, ...validInput }),
    ).rejects.toThrow(UnauthorizedError);
  });

  it("lanza BookAlreadyExistsError si el ISBN ya existe (aunque venga con guiones)", async () => {
    const { userRepository, createBook } = setup();
    const actor = await createActor(userRepository, "LIBRARIAN");

    await createBook.execute({ actorId: actor.id, ...validInput });

    await expect(
      createBook.execute({
        actorId: actor.id,
        ...validInput,
        isbn: "978-3-16-148410-0",
        title: "Otro título con el mismo ISBN",
      }),
    ).rejects.toThrow(BookAlreadyExistsError);
  });
});
