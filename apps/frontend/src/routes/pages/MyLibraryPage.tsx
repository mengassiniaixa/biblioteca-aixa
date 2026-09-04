import { BookOpen, Bookmark, History } from "lucide-react";
import { ApiError } from "../../api/ApiError";
import type {
  Loan,
  LoanHistoryEntry,
  Reservation,
} from "../../api/types";
import {
  useMyLoanHistory,
  useMyLoans,
  useReturnLoan,
} from "../../hooks/useLoans";
import {
  useCancelReservation,
  useMyReservations,
} from "../../hooks/useReservations";
import {
  Badge,
  Button,
  TableSkeleton,
  useConfirm,
  useToast,
} from "../../components/ui";

export function MyLibraryPage() {
  const toast = useToast();
  const confirm = useConfirm();

  const myLoans = useMyLoans();
  const myReservations = useMyReservations();
  const history = useMyLoanHistory();

  const returnLoan = useReturnLoan();
  const cancelReservation = useCancelReservation();

  const actionPending = returnLoan.isPending || cancelReservation.isPending;

  const handleReturn = async (loan: Loan) => {
    const ok = await confirm({
      title: `Devolver "${loan.book.title}"`,
      description: "Se registra la devolución en tu cuenta.",
      confirmLabel: "Devolver",
    });
    if (!ok) return;
    try {
      await returnLoan.mutateAsync(loan.id);
      toast.success("Devolución registrada.");
    } catch (error) {
      toast.error(toErrorMessage(error), {
        title: "No pudimos devolver el préstamo",
      });
    }
  };

  const handleCancel = async (reservation: Reservation) => {
    const ok = await confirm({
      title: `Cancelar reserva de "${reservation.book.title}"`,
      description: "Se libera tu turno para este libro.",
      confirmLabel: "Cancelar reserva",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await cancelReservation.mutateAsync(reservation.id);
      toast.success("Reserva cancelada.");
    } catch (error) {
      toast.error(toErrorMessage(error), {
        title: "No pudimos cancelar la reserva",
      });
    }
  };

  return (
    <section className="space-y-10">
      <header>
        <p className="text-xs uppercase tracking-widest text-ink-muted">
          Socixs
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">
          Mi biblioteca
        </h1>
        <p className="mt-1 text-sm text-ink-mid">
          Tus préstamos activos, reservas e historial en un solo lugar.
        </p>
      </header>

      <ActiveLoansSection
        loans={myLoans.data ?? []}
        isPending={myLoans.isPending}
        isError={myLoans.isError}
        error={myLoans.error}
        onReturn={handleReturn}
        actionPending={actionPending}
      />

      <ActiveReservationsSection
        reservations={myReservations.data ?? []}
        isPending={myReservations.isPending}
        isError={myReservations.isError}
        error={myReservations.error}
        onCancel={handleCancel}
        actionPending={actionPending}
      />

      <HistorySection
        history={history.data ?? []}
        isPending={history.isPending}
        isError={history.isError}
        error={history.error}
      />
    </section>
  );
}

interface ActiveLoansProps {
  loans: Loan[];
  isPending: boolean;
  isError: boolean;
  error: unknown;
  onReturn: (loan: Loan) => void;
  actionPending: boolean;
}

function ActiveLoansSection({
  loans,
  isPending,
  isError,
  error,
  onReturn,
  actionPending,
}: ActiveLoansProps) {
  return (
    <SectionShell
      icon={<BookOpen size={18} />}
      title="Préstamos activos"
      description="Libros que tenés que devolver."
    >
      {isPending ? (
        <TableSkeleton rows={2} columns={4} ariaLabel="Cargando préstamos" />
      ) : isError ? (
        <p role="alert" className="text-sm text-accent">
          {toErrorMessage(error)}
        </p>
      ) : loans.length === 0 ? (
        <EmptyState message="No tenés préstamos activos." />
      ) : (
        <div className="overflow-hidden rounded border border-paper-edge bg-paper shadow-card">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-paper-mid text-left">
              <tr className="text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-3 py-2 font-medium">Libro</th>
                <th className="px-3 py-2 font-medium">Prestado</th>
                <th className="px-3 py-2 font-medium">Vence</th>
                <th className="px-3 py-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => {
                const days = daysUntil(loan.dueDate);
                return (
                  <tr
                    key={loan.id}
                    className="border-t border-paper-edge transition-colors hover:bg-paper-soft"
                  >
                    <td className="px-3 py-2">
                      <div className="font-medium text-ink">
                        {loan.book.title}
                      </div>
                      <div className="text-xs text-ink-muted">
                        {loan.book.author}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-ink-mid">
                      {formatDate(loan.loanDate)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-ink-mid">
                        {formatDate(loan.dueDate)}
                      </div>
                      <DueBadge days={days} />
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onReturn(loan)}
                        disabled={actionPending}
                      >
                        Devolver
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </SectionShell>
  );
}

interface ActiveReservationsProps {
  reservations: Reservation[];
  isPending: boolean;
  isError: boolean;
  error: unknown;
  onCancel: (reservation: Reservation) => void;
  actionPending: boolean;
}

function ActiveReservationsSection({
  reservations,
  isPending,
  isError,
  error,
  onCancel,
  actionPending,
}: ActiveReservationsProps) {
  return (
    <SectionShell
      icon={<Bookmark size={18} />}
      title="Reservas activas"
      description="Libros que esperás retirar."
    >
      {isPending ? (
        <TableSkeleton rows={2} columns={4} ariaLabel="Cargando reservas" />
      ) : isError ? (
        <p role="alert" className="text-sm text-accent">
          {toErrorMessage(error)}
        </p>
      ) : reservations.length === 0 ? (
        <EmptyState message="No tenés reservas activas." />
      ) : (
        <div className="overflow-hidden rounded border border-paper-edge bg-paper shadow-card">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-paper-mid text-left">
              <tr className="text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-3 py-2 font-medium">Libro</th>
                <th className="px-3 py-2 font-medium">Reservado</th>
                <th className="px-3 py-2 font-medium">Estado</th>
                <th className="px-3 py-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((reservation) => (
                <tr
                  key={reservation.id}
                  className="border-t border-paper-edge transition-colors hover:bg-paper-soft"
                >
                  <td className="px-3 py-2">
                    <div className="font-medium text-ink">
                      {reservation.book.title}
                    </div>
                    <div className="text-xs text-ink-muted">
                      {reservation.book.author}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-ink-mid">
                    {formatDate(reservation.reservationDate)}
                  </td>
                  <td className="px-3 py-2">
                    <Badge
                      tone={
                        reservation.status === "AVAILABLE" ? "success" : "muted"
                      }
                    >
                      {reservation.status === "AVAILABLE"
                        ? "Lista para retirar"
                        : "En espera"}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onCancel(reservation)}
                      disabled={actionPending}
                    >
                      Cancelar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionShell>
  );
}

interface HistoryProps {
  history: LoanHistoryEntry[];
  isPending: boolean;
  isError: boolean;
  error: unknown;
}

function HistorySection({ history, isPending, isError, error }: HistoryProps) {
  return (
    <SectionShell
      icon={<History size={18} />}
      title="Historial de préstamos"
      description="Todos tus préstamos, ordenados del más reciente al más viejo."
    >
      {isPending ? (
        <TableSkeleton rows={3} columns={4} ariaLabel="Cargando historial" />
      ) : isError ? (
        <p role="alert" className="text-sm text-accent">
          {toErrorMessage(error)}
        </p>
      ) : history.length === 0 ? (
        <EmptyState message="Todavía no tenés préstamos registrados." />
      ) : (
        <div className="overflow-hidden rounded border border-paper-edge bg-paper shadow-card">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-paper-mid text-left">
              <tr className="text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-3 py-2 font-medium">Libro</th>
                <th className="px-3 py-2 font-medium">Prestado</th>
                <th className="px-3 py-2 font-medium">Devuelto</th>
                <th className="px-3 py-2 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-t border-paper-edge transition-colors hover:bg-paper-soft"
                >
                  <td className="px-3 py-2">
                    <div className="font-medium text-ink">
                      {entry.book.title}
                    </div>
                    <div className="text-xs text-ink-muted">
                      {entry.book.author}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-ink-mid">
                    {formatDate(entry.loanDate)}
                  </td>
                  <td className="px-3 py-2 text-ink-mid">
                    {entry.returnDate ? formatDate(entry.returnDate) : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <Badge
                      tone={entry.status === "RETURNED" ? "muted" : "success"}
                    >
                      {entry.status === "RETURNED" ? "Devuelto" : "Activo"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionShell>
  );
}

interface SectionShellProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}

function SectionShell({
  icon,
  title,
  description,
  children,
}: SectionShellProps) {
  return (
    <section className="space-y-3">
      <header className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-1 rounded-full bg-paper-mid p-2 text-ink"
        >
          {icon}
        </span>
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-ink">
            {title}
          </h2>
          <p className="text-sm text-ink-mid">{description}</p>
        </div>
      </header>
      {children}
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded border border-dashed border-paper-edge bg-paper px-4 py-8 text-center text-sm text-ink-muted">
      {message}
    </div>
  );
}

function DueBadge({ days }: { days: number }) {
  if (days < 0) {
    const overdueDays = Math.abs(days);
    return (
      <Badge tone="danger">
        Vencido hace {overdueDays} {overdueDays === 1 ? "día" : "días"}
      </Badge>
    );
  }
  if (days === 0) {
    return <Badge tone="danger">Vence hoy</Badge>;
  }
  if (days <= 3) {
    return (
      <Badge tone="outline">
        En {days} {days === 1 ? "día" : "días"}
      </Badge>
    );
  }
  return (
    <Badge tone="muted">
      En {days} {days === 1 ? "día" : "días"}
    </Badge>
  );
}

function daysUntil(iso: string): number {
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return 0;
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffMs = startOfDay(target) - startOfDay(new Date());
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("es-AR");
}

function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Necesitás iniciar sesión";
    if (error.status === 403) return "No tenés permisos para esta acción";
    return error.message || "Error inesperado";
  }
  if (error instanceof Error && error.message) return error.message;
  return "Error inesperado";
}
