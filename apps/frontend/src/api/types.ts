export type Role = "MEMBER" | "LIBRARIAN" | "ADMIN";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Book {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
}

export interface SearchBooksQuery {
  title?: string;
  author?: string;
  category?: string;
}

export interface CreateBookRequest {
  isbn: string;
  title: string;
  author: string;
  category: string;
  totalCopies: number;
}

export interface UpdateBookRequest {
  title?: string;
  author?: string;
  category?: string;
  totalCopies?: number;
}

export interface BookSummary {
  id: string;
  title: string;
  author: string;
  isbn: string;
}

export interface Loan {
  id: string;
  bookId: string;
  userId: string;
  loanDate: string;
  dueDate: string;
  status: string;
  book: BookSummary;
}

export interface LoanHistoryEntry {
  id: string;
  bookId: string;
  userId: string;
  loanDate: string;
  dueDate: string;
  returnDate: string | null;
  status: string;
  book: BookSummary;
}

export interface ReturnBookResponse {
  loanId: string;
  bookId: string;
  userId: string;
  returnDate: string;
  status: string;
  reservationPromotedTo?: string;
}

export interface Reservation {
  id: string;
  bookId: string;
  userId: string;
  reservationDate: string;
  status: string;
  book: BookSummary;
}

export interface OverdueLoan {
  id: string;
  loanDate: string;
  dueDate: string;
  daysOverdue: number;
  book: {
    id: string;
    title: string;
    author: string;
    isbn: string;
  };
  member: {
    id: string;
    name: string;
    email: string;
  };
}
