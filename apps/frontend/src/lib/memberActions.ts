import type { Book, Loan, Reservation } from "../api/types";

export type MemberAction =
  | { kind: "loan"; bookId: string }
  | { kind: "return"; loanId: string }
  | { kind: "reserve"; bookId: string }
  | { kind: "cancel"; reservationId: string };

export function resolveMemberAction(
  book: Book,
  myLoans: Loan[],
  myReservations: Reservation[],
): MemberAction {
  const activeLoan = myLoans.find(
    (l) => l.bookId === book.id && l.status !== "RETURNED",
  );
  if (activeLoan) {
    return { kind: "return", loanId: activeLoan.id };
  }
  const activeReservation = myReservations.find(
    (r) =>
      r.bookId === book.id &&
      (r.status === "PENDING" || r.status === "AVAILABLE"),
  );
  if (activeReservation) {
    return { kind: "cancel", reservationId: activeReservation.id };
  }
  if (book.availableCopies > 0) {
    return { kind: "loan", bookId: book.id };
  }
  return { kind: "reserve", bookId: book.id };
}

export const MEMBER_ACTION_LABEL: Record<MemberAction["kind"], string> = {
  loan: "Prestar",
  reserve: "Reservar",
  return: "Devolver",
  cancel: "Cancelar reserva",
};

export const MEMBER_ACTION_VARIANT: Record<
  MemberAction["kind"],
  "primary" | "secondary" | "ghost" | "danger"
> = {
  loan: "primary",
  reserve: "secondary",
  return: "secondary",
  cancel: "ghost",
};

export const MEMBER_ACTION_HINT: Record<MemberAction["kind"], string> = {
  loan: "Te llevás el libro. Tenés 14 días para devolverlo.",
  reserve:
    "El libro no tiene copias disponibles. Reservás tu turno y te lo asignamos apenas alguien lo devuelva.",
  return: "Registra la devolución del libro en tu cuenta.",
  cancel: "Liberás tu turno para este libro.",
};
