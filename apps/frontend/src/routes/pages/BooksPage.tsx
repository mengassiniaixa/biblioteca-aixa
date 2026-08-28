import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { BookSearchForm } from "../../components/BookSearchForm/BookSearchForm";
import { BookList } from "../../components/BookList/BookList";
import { BookForm, type BookFormSubmit } from "../../components/BookForm/BookForm";
import {
  useCreateBook,
  useDeleteBook,
  useSearchBooks,
  useUpdateBook,
} from "../../hooks/useBooks";
import {
  useLoanBook,
  useMyLoans,
  useReturnLoan,
} from "../../hooks/useLoans";
import {
  useCancelReservation,
  useMyReservations,
  useReserveBook,
} from "../../hooks/useReservations";
import { ApiError } from "../../api/ApiError";
import type { Book, SearchBooksQuery } from "../../api/types";

type EditingState =
  | { kind: "none" }
  | { kind: "create" }
  | { kind: "edit"; book: Book };

export function BooksPage() {
  const { user, isAuthenticated } = useAuth();
  const canManage = user?.role === "LIBRARIAN" || user?.role === "ADMIN";
  const canMember = user?.role === "MEMBER";

  const [query, setQuery] = useState<SearchBooksQuery>({});
  const [editing, setEditing] = useState<EditingState>({ kind: "none" });
  const [formError, setFormError] = useState<string | null>(null);

  const search = useSearchBooks(query);
  const createBook = useCreateBook();
  const updateBook = useUpdateBook();
  const deleteBook = useDeleteBook();

  const myLoans = useMyLoans(canMember);
  const myReservations = useMyReservations(canMember);
  const loanBook = useLoanBook();
  const returnLoan = useReturnLoan();
  const reserveBook = useReserveBook();
  const cancelReservation = useCancelReservation();

  const memberActionPending =
    loanBook.isPending ||
    returnLoan.isPending ||
    reserveBook.isPending ||
    cancelReservation.isPending;

  const closeForm = () => {
    setEditing({ kind: "none" });
    setFormError(null);
  };

  const handleSubmit = async (payload: BookFormSubmit) => {
    setFormError(null);
    try {
      if (payload.mode === "create") {
        await createBook.mutateAsync(payload.values);
      } else if (editing.kind === "edit") {
        await updateBook.mutateAsync({
          id: editing.book.id,
          body: payload.values,
        });
      }
      closeForm();
    } catch (error) {
      setFormError(toErrorMessage(error));
    }
  };

  const handleDelete = async (book: Book) => {
    if (!window.confirm(`¿Eliminar "${book.title}"?`)) return;
    try {
      await deleteBook.mutateAsync(book);
    } catch (error) {
      window.alert(toErrorMessage(error));
    }
  };

  const runMemberAction = async (
    action: () => Promise<unknown>,
    errorTitle: string,
  ) => {
    try {
      await action();
    } catch (error) {
      window.alert(`${errorTitle}: ${toErrorMessage(error)}`);
    }
  };

  const handleLoan = (bookId: string) =>
    runMemberAction(
      () => loanBook.mutateAsync(bookId),
      "No pudimos prestar el libro",
    );
  const handleReturn = (loanId: string) =>
    runMemberAction(
      () => returnLoan.mutateAsync(loanId),
      "No pudimos devolver el préstamo",
    );
  const handleReserve = (bookId: string) =>
    runMemberAction(
      () => reserveBook.mutateAsync(bookId),
      "No pudimos crear la reserva",
    );
  const handleCancelReservation = (reservationId: string) =>
    runMemberAction(
      () => cancelReservation.mutateAsync(reservationId),
      "No pudimos cancelar la reserva",
    );

  return (
    <section className="mx-auto max-w-5xl p-8">
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Libros</h1>
          {!isAuthenticated ? (
            <p className="text-sm text-slate-500">
              <Link className="underline hover:text-slate-700" to="/login">
                Iniciá sesión
              </Link>{" "}
              para reservar o pedir prestado.
            </p>
          ) : (
            <p className="text-sm text-slate-500">
              Sesión como <strong>{user?.role}</strong>.{" "}
              <Link className="underline hover:text-slate-700" to="/">
                Inicio
              </Link>
            </p>
          )}
        </div>
        {canManage ? (
          <div className="flex gap-2">
            <Link
              to="/overdue"
              className="rounded border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Ver vencidos
            </Link>
            {editing.kind === "none" ? (
              <button
                type="button"
                onClick={() => setEditing({ kind: "create" })}
                className="rounded bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
              >
                Nuevo libro
              </button>
            ) : null}
          </div>
        ) : null}
      </header>

      <div className="mb-4">
        <BookSearchForm
          initialValues={query}
          onSubmit={(next) => setQuery(next)}
          isSearching={search.isFetching}
        />
      </div>

      {editing.kind !== "none" ? (
        <div className="mb-4">
          <BookForm
            mode={editing.kind === "edit" ? "edit" : "create"}
            initialValues={editing.kind === "edit" ? editing.book : undefined}
            onSubmit={handleSubmit}
            onCancel={closeForm}
            isSubmitting={createBook.isPending || updateBook.isPending}
            errorMessage={formError}
          />
        </div>
      ) : null}

      {search.isError ? (
        <p role="alert" className="mb-4 text-sm text-red-600">
          Error al cargar libros: {toErrorMessage(search.error)}
        </p>
      ) : null}

      {search.isLoading ? (
        <p className="text-sm text-slate-500">Cargando libros…</p>
      ) : (
        <BookList
          books={search.data ?? []}
          canManage={canManage}
          onEdit={(book) => setEditing({ kind: "edit", book })}
          onDelete={handleDelete}
          canMember={canMember}
          myLoans={myLoans.data ?? []}
          myReservations={myReservations.data ?? []}
          onLoan={handleLoan}
          onReturn={handleReturn}
          onReserve={handleReserve}
          onCancelReservation={handleCancelReservation}
          isMemberActionPending={memberActionPending}
        />
      )}
    </section>
  );
}

function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Necesitás iniciar sesión";
    if (error.status === 403) return "No tenés permisos para esta acción";
    if (error.status === 409) return "Conflicto: ese ISBN ya existe";
    return error.message || "Error inesperado";
  }
  if (error instanceof Error) return error.message;
  return "Error inesperado";
}
