import type { Book, Loan, Reservation } from "../../api/types";

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
      <p className="rounded border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
        No hay libros para mostrar.
      </p>
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
    <table className="w-full border-collapse overflow-hidden rounded border border-slate-200 bg-white text-sm">
      <thead className="bg-slate-100 text-left text-slate-700">
        <tr>
          <th className="px-3 py-2">Título</th>
          <th className="px-3 py-2">Autor</th>
          <th className="px-3 py-2">Categoría</th>
          <th className="px-3 py-2">ISBN</th>
          <th className="px-3 py-2">Disponibles</th>
          {showActions ? <th className="px-3 py-2">Acciones</th> : null}
        </tr>
      </thead>
      <tbody>
        {books.map((book) => {
          const memberAction = canMember
            ? resolveMemberAction(book, myLoans, myReservations)
            : null;
          return (
            <tr key={book.id} className="border-t border-slate-200">
              <td className="px-3 py-2 font-medium text-slate-800">{book.title}</td>
              <td className="px-3 py-2 text-slate-700">{book.author}</td>
              <td className="px-3 py-2 text-slate-700">{book.category}</td>
              <td className="px-3 py-2 text-slate-500">{book.isbn}</td>
              <td className="px-3 py-2 text-slate-700">
                {book.availableCopies} / {book.totalCopies}
              </td>
              {showActions ? (
                <td className="flex flex-wrap gap-2 px-3 py-2">
                  {canManage ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onEdit?.(book)}
                        className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete?.(book)}
                        className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                      >
                        Eliminar
                      </button>
                    </>
                  ) : null}
                  {memberAction ? (
                    <button
                      type="button"
                      onClick={() => handleMemberAction(memberAction)}
                      disabled={isMemberActionPending}
                      className="rounded border border-emerald-300 px-2 py-1 text-xs text-emerald-800 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {MEMBER_ACTION_LABEL[memberAction.kind]}
                    </button>
                  ) : null}
                </td>
              ) : null}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
