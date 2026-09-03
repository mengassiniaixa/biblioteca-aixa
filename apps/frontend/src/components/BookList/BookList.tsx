import { BookX } from "lucide-react";
import type { Book, Loan, Reservation } from "../../api/types";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

interface BookListProps {
  books: Book[];
  canManage?: boolean;
  onEdit?: (book: Book) => void;
  onDelete?: (book: Book) => void;
  canMember?: boolean;
  myLoans?: Loan[];
  myReservations?: Reservation[];
  onLoan?: (bookId: string) => void;
  onReturn?: (loanId: string) => void;
  onReserve?: (bookId: string) => void;
  onCancelReservation?: (reservationId: string) => void;
  isMemberActionPending?: boolean;
}

type MemberAction =
  | { kind: "loan"; bookId: string }
  | { kind: "return"; loanId: string }
  | { kind: "reserve"; bookId: string }
  | { kind: "cancel"; reservationId: string };

function resolveMemberAction(
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

const MEMBER_ACTION_LABEL: Record<MemberAction["kind"], string> = {
  loan: "Prestar",
  reserve: "Reservar",
  return: "Devolver",
  cancel: "Cancelar reserva",
};

const MEMBER_ACTION_VARIANT: Record<
  MemberAction["kind"],
  "primary" | "secondary" | "ghost" | "danger"
> = {
  loan: "primary",
  reserve: "secondary",
  return: "secondary",
  cancel: "ghost",
};

export function BookList({
  books,
  canManage = false,
  onEdit,
  onDelete,
  canMember = false,
  myLoans = [],
  myReservations = [],
  onLoan,
  onReturn,
  onReserve,
  onCancelReservation,
  isMemberActionPending = false,
}: BookListProps) {
  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded border border-dashed border-paper-edge bg-paper px-4 py-10 text-center">
        <span
          aria-hidden="true"
          className="rounded-full bg-paper-mid p-3 text-ink-muted"
        >
          <BookX size={22} />
        </span>
        <p className="text-sm font-medium text-ink">No hay libros para mostrar.</p>
        <p className="text-xs text-ink-muted">
          Probá ajustar los filtros de búsqueda.
        </p>
      </div>
    );
  }

  const showActions = canManage || canMember;

  const handleMemberAction = (action: MemberAction) => {
    if (action.kind === "loan") onLoan?.(action.bookId);
    else if (action.kind === "return") onReturn?.(action.loanId);
    else if (action.kind === "reserve") onReserve?.(action.bookId);
    else if (action.kind === "cancel") onCancelReservation?.(action.reservationId);
  };

  return (
    <div className="overflow-hidden rounded border border-paper-edge bg-paper shadow-card">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-paper-mid text-left">
          <tr className="text-xs uppercase tracking-wide text-ink-muted">
            <th className="px-3 py-2 font-medium">Título</th>
            <th className="px-3 py-2 font-medium">Autor</th>
            <th className="px-3 py-2 font-medium">Categoría</th>
            <th className="px-3 py-2 font-medium">ISBN</th>
            <th className="px-3 py-2 font-medium">Disponibles</th>
            {showActions ? (
              <th className="px-3 py-2 font-medium">Acciones</th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {books.map((book) => {
            const memberAction = canMember
              ? resolveMemberAction(book, myLoans, myReservations)
              : null;
            const available = book.availableCopies > 0;
            return (
              <tr
                key={book.id}
                className="border-t border-paper-edge transition-colors hover:bg-paper-soft"
              >
                <td className="px-3 py-2 font-medium text-ink">
                  {book.title}
                </td>
                <td className="px-3 py-2 text-ink-mid">{book.author}</td>
                <td className="px-3 py-2">
                  <Badge tone="muted">{book.category}</Badge>
                </td>
                <td className="px-3 py-2 font-mono text-xs text-ink-muted">
                  {book.isbn}
                </td>
                <td className="px-3 py-2">
                  <Badge tone={available ? "success" : "danger"}>
                    {book.availableCopies} / {book.totalCopies}
                  </Badge>
                </td>
                {showActions ? (
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      {canManage ? (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onEdit?.(book)}
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => onDelete?.(book)}
                          >
                            Eliminar
                          </Button>
                        </>
                      ) : null}
                      {memberAction ? (
                        <Button
                          size="sm"
                          variant={MEMBER_ACTION_VARIANT[memberAction.kind]}
                          onClick={() => handleMemberAction(memberAction)}
                          disabled={isMemberActionPending}
                        >
                          {MEMBER_ACTION_LABEL[memberAction.kind]}
                        </Button>
                      ) : null}
                    </div>
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
