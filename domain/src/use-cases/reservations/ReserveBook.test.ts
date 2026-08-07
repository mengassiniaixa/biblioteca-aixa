import { ReserveBook } from "./ReserveBook";
import { InMemoryBookRepository } from "./__fakes__/InMemoryBookRepository";
import { InMemoryUserRepository } from "./__fakes__/InMemoryUserRepository";
import { InMemoryReservationRepository } from "./__fakes__/InMemoryReservationRepository";
import { Book } from "../../entities/Book";
import { User } from "../../entities/User";
import { Reservation } from "../../entities/Reservation";
import { UserNotFoundError } from "../../errors/UserNotFoundError";
import { BookNotFoundError } from "../../errors/BookNotFoundError";
import { ReservationAlreadyExistsError } from "../../errors/ReservationAlreadyExistsError";

describe("ReserveBook", () => {
  function setup() {
    const reservationRepository = new InMemoryReservationRepository();
    const bookRepository = new InMemoryBookRepository();
    const userRepository = new InMemoryUserRepository();
    const reserveBook = new ReserveBook(
      reservationRepository,
      bookRepository,
      userRepository,
    );
    return {
      reservationRepository,
      bookRepository,
      userRepository,
      reserveBook,
    };
  }

  async function createUser(
    userRepository: InMemoryUserRepository,
    email = "user@test.com",
  ) {
    const user = User.create({
      name: "User",
      email,
      passwordHash: "hash",
      role: "MEMBER",
    });
    await userRepository.save(user);
    return user;
  }

  async function createBookInRepo(bookRepository: InMemoryBookRepository) {
    const book = Book.create({
      isbn: "9783161484100",
      title: "Clean Code",
      author: "R. Martin",
      category: "Tech",
      totalCopies: 1,
    });
    await bookRepository.save(book);
    return book;
  }

  it("crea una reserva PENDING para el usuario y libro dados", async () => {
    const {
      reservationRepository,
      bookRepository,
      userRepository,
      reserveBook,
    } = setup();
    const user = await createUser(userRepository);
    const book = await createBookInRepo(bookRepository);

    const result = await reserveBook.execute({
      userId: user.id,
      bookId: book.id,
    });

    expect(result.status).toBe("PENDING");
    expect(result.userId).toBe(user.id);
    expect(result.bookId).toBe(book.id);
    expect(result.reservationDate).toBeInstanceOf(Date);

    const saved = await reservationRepository.findById(result.id);
    expect(saved).not.toBeNull();
    expect(saved?.status).toBe("PENDING");
  });

  it("lanza UserNotFoundError si el usuario no existe", async () => {
    const { bookRepository, reserveBook } = setup();
    const book = await createBookInRepo(bookRepository);

    await expect(
      reserveBook.execute({ userId: "no-existe", bookId: book.id }),
    ).rejects.toThrow(UserNotFoundError);
  });

  it("lanza BookNotFoundError si el libro no existe", async () => {
    const { userRepository, reserveBook } = setup();
    const user = await createUser(userRepository);

    await expect(
      reserveBook.execute({ userId: user.id, bookId: "no-existe" }),
    ).rejects.toThrow(BookNotFoundError);
  });

  it("lanza ReservationAlreadyExistsError si el usuario ya tiene reserva PENDING para ese libro", async () => {
    const { bookRepository, userRepository, reserveBook } = setup();
    const user = await createUser(userRepository);
    const book = await createBookInRepo(bookRepository);

    await reserveBook.execute({ userId: user.id, bookId: book.id });

    await expect(
      reserveBook.execute({ userId: user.id, bookId: book.id }),
    ).rejects.toThrow(ReservationAlreadyExistsError);
  });

  it("permite al mismo usuario reservar un libro distinto", async () => {
    const { bookRepository, userRepository, reserveBook } = setup();
    const user = await createUser(userRepository);
    const book1 = await createBookInRepo(bookRepository);
    const book2 = Book.create({
      isbn: "9783161484200",
      title: "Otro libro",
      author: "A",
      category: "Tech",
      totalCopies: 1,
    });
    await bookRepository.save(book2);

    await reserveBook.execute({ userId: user.id, bookId: book1.id });
    const result = await reserveBook.execute({
      userId: user.id,
      bookId: book2.id,
    });

    expect(result.status).toBe("PENDING");
    expect(result.bookId).toBe(book2.id);
  });

  it("permite al mismo usuario reservar de nuevo si la reserva anterior fue cancelada", async () => {
    const {
      reservationRepository,
      bookRepository,
      userRepository,
      reserveBook,
    } = setup();
    const user = await createUser(userRepository);
    const book = await createBookInRepo(bookRepository);

    const previous = Reservation.reconstitute({
      id: "res-previa",
      bookId: book.id,
      userId: user.id,
      reservationDate: new Date("2026-01-01"),
      status: "CANCELLED",
    });
    await reservationRepository.save(previous);

    const result = await reserveBook.execute({
      userId: user.id,
      bookId: book.id,
    });

    expect(result.status).toBe("PENDING");
    expect(result.id).not.toBe("res-previa");
  });

  it("permite reservar aunque otro usuario ya tenga una reserva PENDING para el mismo libro", async () => {
    const { bookRepository, userRepository, reserveBook } = setup();
    const user1 = await createUser(userRepository, "user1@test.com");
    const user2 = await createUser(userRepository, "user2@test.com");
    const book = await createBookInRepo(bookRepository);

    await reserveBook.execute({ userId: user1.id, bookId: book.id });
    const result = await reserveBook.execute({
      userId: user2.id,
      bookId: book.id,
    });

    expect(result.status).toBe("PENDING");
    expect(result.userId).toBe(user2.id);
  });
});
