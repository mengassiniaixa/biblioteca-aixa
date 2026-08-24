import {
  AuthenticateUser,
  CancelReservation,
  CreateBook,
  DeleteBook,
  ListOverdueLoans,
  LoanBook,
  RegisterUser,
  ReserveBook,
  ReturnBook,
  SearchBooks,
  UpdateBook,
} from "@mi-proyecto/domain";
import { InMemoryBookRepository } from "../infra/repositories/InMemoryBookRepository";
import { InMemoryLoanRepository } from "../infra/repositories/InMemoryLoanRepository";
import { InMemoryReservationRepository } from "../infra/repositories/InMemoryReservationRepository";
import { InMemoryUserRepository } from "../infra/repositories/InMemoryUserRepository";
import { BcryptPasswordHasher } from "../infra/services/BcryptPasswordHasher";
import { JwtTokenService } from "../infra/services/JwtTokenService";
import { SystemClock } from "../infra/services/SystemClock";

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
    reserveBook: ReserveBook;
    cancelReservation: CancelReservation;
  };
  tokenService: JwtTokenService;
}

interface BuildOptions {
  jwtSecret: string;
  jwtExpiresIn: string;
}

export function buildContainer(opts: BuildOptions): Container {
  const userRepository = new InMemoryUserRepository();
  const bookRepository = new InMemoryBookRepository();
  const loanRepository = new InMemoryLoanRepository();
  const reservationRepository = new InMemoryReservationRepository();

  const passwordHasher = new BcryptPasswordHasher();
  const tokenService = new JwtTokenService(opts.jwtSecret, opts.jwtExpiresIn);
  const clock = new SystemClock();

  return {
    tokenService,
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
        clock,
      ),
      reserveBook: new ReserveBook(
        reservationRepository,
        bookRepository,
        userRepository,
      ),
      cancelReservation: new CancelReservation(
        reservationRepository,
        userRepository,
      ),
    },
  };
}
