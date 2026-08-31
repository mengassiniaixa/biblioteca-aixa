import {
  AuthenticateUser,
  Book,
  BookRepository,
  CancelReservation,
  CreateBook,
  DeleteBook,
  ListMyLoans,
  ListMyReservations,
  ListOverdueLoans,
  Loan,
  LoanBook,
  LoanRepository,
  RegisterUser,
  ReservationRepository,
  ReserveBook,
  ReturnBook,
  SearchBooks,
  UpdateBook,
  User,
  UserRepository,
} from "@mi-proyecto/domain";
import { getPool } from "../infra/db/pool";
import { InMemoryBookRepository } from "../infra/repositories/InMemoryBookRepository";
import { InMemoryLoanRepository } from "../infra/repositories/InMemoryLoanRepository";
import { InMemoryReservationRepository } from "../infra/repositories/InMemoryReservationRepository";
import { InMemoryUserRepository } from "../infra/repositories/InMemoryUserRepository";
import { PgBookRepository } from "../infra/repositories/PgBookRepository";
import { PgLoanRepository } from "../infra/repositories/PgLoanRepository";
import { PgReservationRepository } from "../infra/repositories/PgReservationRepository";
import { PgUserRepository } from "../infra/repositories/PgUserRepository";
import { BcryptPasswordHasher } from "../infra/services/BcryptPasswordHasher";
import { JwtTokenService } from "../infra/services/JwtTokenService";
import { SystemClock } from "../infra/services/SystemClock";
import type { RepositoryMode } from "../config";

export interface Container {
  useCases: {
    registerUser: RegisterUser;
    authenticateUser: AuthenticateUser;
    createBook: CreateBook;
    updateBook: UpdateBook;
    deleteBook: DeleteBook;
    searchBooks: SearchBooks;
    loanBook: LoanBook;
    returnBook: ReturnBook;
    listOverdueLoans: ListOverdueLoans;
    listMyLoans: ListMyLoans;
    reserveBook: ReserveBook;
    cancelReservation: CancelReservation;
    listMyReservations: ListMyReservations;
  };
  tokenService: JwtTokenService;
  seedLibrarian: (opts: SeedLibrarianOptions) => Promise<void>;
  seedBooks: () => Promise<void>;
  seedDemoOverdue: () => Promise<void>;
}

interface BuildOptions {
  jwtSecret: string;
  jwtExpiresIn: string;
  repositoryMode: RepositoryMode;
  databaseUrl: string | null;
}

export interface SeedLibrarianOptions {
  name: string;
  email: string;
  password: string;
}

interface Repositories {
  userRepository: UserRepository;
  bookRepository: BookRepository;
  loanRepository: LoanRepository;
  reservationRepository: ReservationRepository;
}

function buildRepositories(
  mode: RepositoryMode,
  databaseUrl: string | null,
): Repositories {
  if (mode === "pg") {
    if (!databaseUrl) {
      throw new Error("REPOSITORY_MODE=pg requiere databaseUrl");
    }
    const pool = getPool(databaseUrl);
    return {
      userRepository: new PgUserRepository(pool),
      bookRepository: new PgBookRepository(pool),
      loanRepository: new PgLoanRepository(pool),
      reservationRepository: new PgReservationRepository(pool),
    };
  }
  return {
    userRepository: new InMemoryUserRepository(),
    bookRepository: new InMemoryBookRepository(),
    loanRepository: new InMemoryLoanRepository(),
    reservationRepository: new InMemoryReservationRepository(),
  };
}

export function buildContainer(opts: BuildOptions): Container {
  const { userRepository, bookRepository, loanRepository, reservationRepository } =
    buildRepositories(opts.repositoryMode, opts.databaseUrl);

  const passwordHasher = new BcryptPasswordHasher();
  const tokenService = new JwtTokenService(opts.jwtSecret, opts.jwtExpiresIn);
  const clock = new SystemClock();

  const seedLibrarian = async (seed: SeedLibrarianOptions) => {
    const existing = await userRepository.findByEmail(seed.email);
    if (existing) return;
    const passwordHash = await passwordHasher.hash(seed.password);
    const user = User.create({
      name: seed.name,
      email: seed.email,
      passwordHash,
      role: "LIBRARIAN",
    });
    await userRepository.save(user);
  };

  const seedBooks = async () => {
    const current = await bookRepository.findAll();
    if (current.length > 0) return;
    const initial = [
      {
        isbn: "9780441172719",
        title: "Dune",
        author: "Frank Herbert",
        category: "SciFi",
        totalCopies: 3,
      },
      {
        isbn: "9780547928227",
        title: "El Hobbit",
        author: "J.R.R. Tolkien",
        category: "Fantasía",
        totalCopies: 2,
      },
      {
        isbn: "9780132350884",
        title: "Clean Code",
        author: "Robert C. Martin",
        category: "Programación",
        totalCopies: 4,
      },
      {
        isbn: "9780307474728",
        title: "Cien años de soledad",
        author: "Gabriel García Márquez",
        category: "Ficción",
        totalCopies: 2,
      },
    ];
    for (const input of initial) {
      await bookRepository.save(Book.create(input));
    }
  };

  const seedDemoOverdue = async () => {
    const email = "demo-overdue@biblioteca.local";
    const existing = await userRepository.findByEmail(email);
    if (existing) return;

    const passwordHash = await passwordHasher.hash("member123");
    const member = User.create({
      name: "Socio Demo Vencido",
      email,
      passwordHash,
      role: "MEMBER",
    });
    await userRepository.save(member);

    const book = await bookRepository.findByIsbn("9780441172719");
    if (!book) return;

    const now = clock.now();
    const loanDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const dueDate = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
    const loan = Loan.create({
      bookId: book.id,
      userId: member.id,
      loanDate,
      dueDate,
    });
    book.decreaseAvailability();
    await bookRepository.save(book);
    await loanRepository.save(loan);
  };

  return {
    tokenService,
    seedLibrarian,
    seedBooks,
    seedDemoOverdue,
    useCases: {
      registerUser: new RegisterUser(userRepository, passwordHasher),
      authenticateUser: new AuthenticateUser(
        userRepository,
        passwordHasher,
        tokenService,
      ),
      createBook: new CreateBook(bookRepository, userRepository),
      updateBook: new UpdateBook(bookRepository, userRepository),
      deleteBook: new DeleteBook(bookRepository, userRepository),
      searchBooks: new SearchBooks(bookRepository),
      loanBook: new LoanBook(bookRepository, loanRepository, clock),
      returnBook: new ReturnBook(
        loanRepository,
        bookRepository,
        reservationRepository,
        clock,
      ),
      listOverdueLoans: new ListOverdueLoans(
        loanRepository,
        userRepository,
        bookRepository,
        clock,
      ),
      listMyLoans: new ListMyLoans(loanRepository),
      reserveBook: new ReserveBook(
        reservationRepository,
        bookRepository,
        userRepository,
      ),
      cancelReservation: new CancelReservation(
        reservationRepository,
        userRepository,
      ),
      listMyReservations: new ListMyReservations(reservationRepository),
    },
  };
}
