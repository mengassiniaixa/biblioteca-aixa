export { Book } from "./entities/Book";
export { Loan } from "./entities/Loan";
export { Reservation } from "./entities/Reservation";
export { User } from "./entities/User";
export type { Role } from "./entities/User";
export { Fine } from "./entities/Fine";

export { Email } from "./value-objects/Email";
export { ISBN } from "./value-objects/ISBN";

export type { BookRepository } from "./repositories/BookRepository";
export type { LoanRepository } from "./repositories/LoanRepository";
export type { ReservationRepository } from "./repositories/ReservationRepository";
export type { UserRepository } from "./repositories/UserRepository";

export type { Clock } from "./services/Clock";
export type { PasswordHasher } from "./services/PasswordHasher";
export type { TokenService } from "./services/TokenService";

export { DomainError } from "./errors/DomainError";
export { BookAlreadyExistsError } from "./errors/BookAlreadyExistsError";
export { BookAlreadyLoanedError } from "./errors/BookAlreadyLoanedError";
export { BookHasActiveLoansError } from "./errors/BookHasActiveLoansError";
export { BookNotAvailableError } from "./errors/BookNotAvailableError";
export { BookNotFoundError } from "./errors/BookNotFoundError";
export { EmailAlreadyInUseError } from "./errors/EmailAlreadyInUseError";
export { InvalidCredentialsError } from "./errors/InvalidCredentialsError";
export { LoanLimitExceededError } from "./errors/LoanLimitExceededError";
export { LoanNotFoundError } from "./errors/LoanNotFoundError";
export { ReservationAlreadyExistsError } from "./errors/ReservationAlreadyExistsError";
export { ReservationNotFoundError } from "./errors/ReservationNotFoundError";
export { UnauthorizedError } from "./errors/UnauthorizedError";
export { UserNotFoundError } from "./errors/UserNotFoundError";

export { RegisterUser } from "./use-cases/auth/RegisterUser";
export { AuthenticateUser } from "./use-cases/auth/AuthenticateUser";
export { CreateBook } from "./use-cases/books/CreateBook";
export { UpdateBook } from "./use-cases/books/UpdateBook";
export { DeleteBook } from "./use-cases/books/DeleteBook";
export { SearchBooks } from "./use-cases/books/SearchBooks";
export { LoanBook } from "./use-cases/loans/LoanBook";
export { ReturnBook } from "./use-cases/loans/ReturnBook";
export { ListOverdueLoans } from "./use-cases/loans/ListOverdueLoans";
export { ListMyLoans } from "./use-cases/loans/ListMyLoans";
export { ReserveBook } from "./use-cases/reservations/ReserveBook";
export { CancelReservation } from "./use-cases/reservations/CancelReservation";
export { ListMyReservations } from "./use-cases/reservations/ListMyReservations";
