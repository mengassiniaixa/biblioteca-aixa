import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
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
import {
  Button,
  TableSkeleton,
  useToast,
  useConfirm,
} from "../../components/ui";

type EditingState =
  | { kind: "none" }
  | { kind: "create" }
  | { kind: "edit"; book: Book };

export function BooksPage() {
  const { user, isAuthenticated } = useAuth();
  const canManage = user?.role === "LIBRARIAN" || user?.role === "ADMIN";
  const canMember = user?.role === "MEMBER";
  const toast = useToast();
  const confirm = useConfirm();

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
        toast.success(`Libro "${payload.values.title}" creado.`);
      } else if (editing.kind === "edit") {
        await updateBook.mutateAsync({
          id: editing.book.id,
          body: payload.values,
        });
        toast.success(`Libro "${payload.values.title}" actualizado.`);
      }
      closeForm();
    } catch (error) {
      setFormError(toErrorMessage(error));
    }
  };

  const handleDelete = async (book: Book) => {
    const ok = await confirm({
      title: `Eliminar "${book.title}"`,
      description: "Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await deleteBook.mutateAsync(book);
      toast.success(`"${book.title}" fue eliminado.`);
    } catch (error) {
      toast.error(toErrorMessage(error), { title: "No pudimos eliminarlo" });
    }
  };

  const runMemberAction = async (
    action: () => Promise<unknown>,
    successMessage: string,
    errorTitle: string,
  ) => {
    try {
      await action();
      toast.success(successMessage);
    } catch (error) {
      toast.error(toErrorMessage(error), { title: errorTitle });
    }
  };

  const handleLoan = (bookId: string) =>
    runMemberAction(
      () => loanBook.mutateAsync(bookId),
      "Préstamo registrado.",
      "No pudimos prestar el libro",
    );
  const handleReturn = (loanId: string) =>
    runMemberAction(
      () => returnLoan.mutateAsync(loanId),
      "Devolución registrada.",
      "No pudimos devolver el préstamo",
    );
  const handleReserve = (bookId: string) =>
    runMemberAction(
      () => reserveBook.mutateAsync(bookId),
      "Reserva creada.",
      "No pudimos crear la reserva",
    );
  const handleCancelReservation = (reservationId: string) =>
    runMemberAction(
      () => cancelReservation.mutateAsync(reservationId),
      "Reserva cancelada.",
      "No pudimos cancelar la reserva",
    );

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-ink-muted">
            Catálogo
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">
            Libros
          </h1>
          {!isAuthenticated ? (
            <p className="mt-1 text-sm text-ink-mid">
              <Link
                className="font-medium text-ink underline underline-offset-4 hover:text-accent"
                to="/login"
              >
                Iniciá sesión
              </Link>{" "}
              para reservar o pedir prestado.
            </p>
          ) : (
            <p className="mt-1 text-sm text-ink-mid">
              Bienvenida, <strong className="text-ink">{user?.role}</strong>.
            </p>
          )}
        </div>
        {canManage && editing.kind === "none" ? (
          <Button
            variant="primary"
            onClick={() => setEditing({ kind: "create" })}
            iconLeft={<Plus size={16} />}
          >
            Nuevo libro
          </Button>
        ) : null}
      </header>

      <BookSearchForm
        initialValues={query}
        onSubmit={(next) => setQuery(next)}
        isSearching={search.isFetching}
      />

      {editing.kind !== "none" ? (
        <BookForm
          mode={editing.kind === "edit" ? "edit" : "create"}
          initialValues={editing.kind === "edit" ? editing.book : undefined}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          isSubmitting={createBook.isPending || updateBook.isPending}
          errorMessage={formError}
        />
      ) : null}

      {search.isError ? (
        <p role="alert" className="text-sm text-accent">
          Error al cargar libros: {toErrorMessage(search.error)}
        </p>
      ) : null}

      {search.isLoading ? (
        <TableSkeleton
          rows={4}
          columns={canManage || canMember ? 6 : 5}
          ariaLabel="Cargando libros"
        />
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
