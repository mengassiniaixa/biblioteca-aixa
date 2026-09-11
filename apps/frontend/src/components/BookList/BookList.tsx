import { BookX } from "lucide-react";
import { Link } from "react-router-dom";
import type { Book, Loan, Reservation } from "../../api/types";
import {
  MEMBER_ACTION_HINT,
  MEMBER_ACTION_LABEL,
  MEMBER_ACTION_VARIANT,
  resolveMemberAction,
  type MemberAction,
} from "../../lib/memberActions";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Tooltip } from "../ui/Tooltip";

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
                  <Link
                    to={`/books/${book.id}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {book.title}
                  </Link>
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
                        <Tooltip content={MEMBER_ACTION_HINT[memberAction.kind]}>
                          <Button
                            size="sm"
                            variant={MEMBER_ACTION_VARIANT[memberAction.kind]}
                            onClick={() => handleMemberAction(memberAction)}
                            disabled={isMemberActionPending}
                          >
                            {MEMBER_ACTION_LABEL[memberAction.kind]}
                          </Button>
                        </Tooltip>
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
