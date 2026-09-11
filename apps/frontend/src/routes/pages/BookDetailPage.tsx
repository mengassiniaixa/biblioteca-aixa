import { ArrowLeft, Book as BookIcon } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../../api/ApiError";
import type { Book } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { useBook, useDeleteBook } from "../../hooks/useBooks";
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
import {
  Badge,
  Button,
  Card,
  Skeleton,
  useConfirm,
  useToast,
} from "../../components/ui";
import {
  MEMBER_ACTION_LABEL,
  MEMBER_ACTION_VARIANT,
  resolveMemberAction,
  type MemberAction,
} from "../../lib/memberActions";

export function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMember = user?.role === "MEMBER";
  const canManage = user?.role === "LIBRARIAN" || user?.role === "ADMIN";

  const toast = useToast();
  const confirm = useConfirm();

  const book = useBook(id);
  const myLoans = useMyLoans(isMember);
  const myReservations = useMyReservations(isMember);

  const loanBook = useLoanBook();
  const returnLoan = useReturnLoan();
  const reserveBook = useReserveBook();
  const cancelReservation = useCancelReservation();
  const deleteBook = useDeleteBook();

  const memberActionPending =
    loanBook.isPending ||
    returnLoan.isPending ||
    reserveBook.isPending ||
    cancelReservation.isPending;

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

  const handleMemberAction = (action: MemberAction) => {
    if (action.kind === "loan") {
      runMemberAction(
        () => loanBook.mutateAsync(action.bookId),
        "Préstamo registrado.",
        "No pudimos prestar el libro",
      );
    } else if (action.kind === "return") {
      runMemberAction(
        () => returnLoan.mutateAsync(action.loanId),
        "Devolución registrada.",
        "No pudimos devolver el préstamo",
      );
    } else if (action.kind === "reserve") {
      runMemberAction(
        () => reserveBook.mutateAsync(action.bookId),
        "Reserva creada.",
        "No pudimos crear la reserva",
      );
    } else if (action.kind === "cancel") {
      runMemberAction(
        () => cancelReservation.mutateAsync(action.reservationId),
        "Reserva cancelada.",
        "No pudimos cancelar la reserva",
      );
    }
  };

  const handleDelete = async (target: Book) => {
    const ok = await confirm({
      title: `Eliminar "${target.title}"`,
      description: "Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await deleteBook.mutateAsync(target);
      toast.success(`"${target.title}" fue eliminado.`);
      navigate("/books");
    } catch (error) {
      toast.error(toErrorMessage(error), { title: "No pudimos eliminarlo" });
    }
  };

  if (book.isPending) {
    return <DetailSkeleton />;
  }

  if (book.isError) {
    const status =
      book.error instanceof ApiError ? book.error.status : undefined;
    return (
      <NotFoundOrError
        title={status === 404 ? "No encontramos ese libro" : "Error al cargar"}
        description={
          status === 404
            ? "Puede que haya sido eliminado o que el link esté mal."
            : toErrorMessage(book.error)
        }
      />
    );
  }

  const data = book.data;
  if (!data) {
    return (
      <NotFoundOrError
        title="No encontramos ese libro"
        description="Puede que haya sido eliminado o que el link esté mal."
      />
    );
  }

  const available = data.availableCopies > 0;
  const memberAction = isMember
    ? resolveMemberAction(
        data,
        myLoans.data ?? [],
        myReservations.data ?? [],
      )
    : null;

  return (
    <section className="space-y-6">
      <div>
        <Link
          to="/books"
          className="inline-flex items-center gap-1 text-sm font-medium text-ink-mid hover:text-ink"
        >
          <ArrowLeft size={14} /> Volver al catálogo
        </Link>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span
            aria-hidden="true"
            className="rounded bg-paper-mid p-4 text-ink"
          >
            <BookIcon size={28} />
          </span>
          <div>
            <p className="text-xs uppercase tracking-widest text-ink-muted">
              {data.category}
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">
              {data.title}
            </h1>
            <p className="mt-1 text-sm text-ink-mid">por {data.author}</p>
          </div>
        </div>
        <Badge tone={available ? "success" : "danger"}>
          {available ? "Disponible" : "Sin copias"}
        </Badge>
      </header>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailRow label="ISBN" value={data.isbn} mono />
            <DetailRow label="Categoría" value={data.category} />
            <DetailRow label="Copias totales" value={String(data.totalCopies)} />
            <DetailRow
              label="Copias disponibles"
              value={`${data.availableCopies} / ${data.totalCopies}`}
            />
          </div>
        </Card>

        <Card className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-ink-muted">
              Acciones
            </p>
            <p className="mt-1 text-sm text-ink-mid">
              {canManage
                ? "Gestionar este libro."
                : isMember
                  ? "¿Qué querés hacer con este libro?"
                  : "Iniciá sesión para pedir prestado o reservar."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canManage ? (
              <Button
                variant="danger"
                onClick={() => handleDelete(data)}
                disabled={deleteBook.isPending}
              >
                Eliminar
              </Button>
            ) : null}
            {memberAction ? (
              <Button
                variant={MEMBER_ACTION_VARIANT[memberAction.kind]}
                onClick={() => handleMemberAction(memberAction)}
                disabled={memberActionPending}
              >
                {MEMBER_ACTION_LABEL[memberAction.kind]}
              </Button>
            ) : null}
            {!canManage && !isMember ? (
              <Link
                to="/login"
                className="text-sm font-medium text-ink underline underline-offset-4 hover:text-accent"
              >
                Ir a iniciar sesión
              </Link>
            ) : null}
          </div>
        </Card>
      </div>
    </section>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-ink-muted">
        {label}
      </p>
      <p
        className={
          mono
            ? "mt-1 font-mono text-sm text-ink"
            : "mt-1 text-sm font-medium text-ink"
        }
      >
        {value}
      </p>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <section className="space-y-6">
      <Skeleton className="h-4 w-32" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="space-y-3">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
        </Card>
        <Card className="space-y-3">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-9 w-full" />
        </Card>
      </div>
    </section>
  );
}

function NotFoundOrError({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="space-y-4 py-12 text-center">
      <p className="text-xs uppercase tracking-widest text-ink-muted">Libro</p>
      <h1 className="text-3xl font-bold tracking-tight text-ink">{title}</h1>
      <p className="text-sm text-ink-mid">{description}</p>
      <Link
        to="/books"
        className="mt-2 inline-block text-sm font-medium text-ink underline underline-offset-4 hover:text-accent"
      >
        Volver al catálogo
      </Link>
    </section>
  );
}

function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Necesitás iniciar sesión";
    if (error.status === 403) return "No tenés permisos para esta acción";
    if (error.status === 404) return "No encontramos ese libro";
    return error.message || "Error inesperado";
  }
  if (error instanceof Error && error.message) return error.message;
  return "Error inesperado";
}
