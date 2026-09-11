import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Bookmark,
  Clock,
  History,
  Library,
  Plus,
  Users,
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { useMyLoanHistory, useMyLoans } from "../../hooks/useLoans";
import { useMyReservations } from "../../hooks/useReservations";
import { useLibraryStats } from "../../hooks/useStats";
import {
  Badge,
  buttonClassName,
  Card,
  CardTitle,
  Skeleton,
} from "../../components/ui";
import type { Loan, LibraryStats } from "../../api/types";

export function HomePage() {
  const { user } = useAuth();
  const isMember = user?.role === "MEMBER";
  const canManage = user?.role === "LIBRARIAN" || user?.role === "ADMIN";

  return (
    <section className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-widest text-ink-muted">
          Inicio
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">
          Hola de nuevo
        </h1>
        <p className="mt-1 text-sm text-ink-mid">
          {canManage
            ? "Panorama general de la biblioteca."
            : "Un vistazo rápido a tu actividad."}
        </p>
      </header>

      {isMember ? <MemberHome /> : null}
      {canManage ? <LibrarianHome /> : null}
    </section>
  );
}

function MemberHome() {
  const myLoans = useMyLoans();
  const myReservations = useMyReservations();
  const history = useMyLoanHistory();

  const loans = myLoans.data ?? [];
  const reservations = myReservations.data ?? [];
  const historyEntries = history.data ?? [];
  const nextDue = pickNextDue(loans);
  const latestHistory = historyEntries.slice(0, 3);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          icon={<BookOpen size={18} />}
          label="Préstamos activos"
          value={myLoans.isPending ? null : loans.length}
          hint={
            myLoans.isPending
              ? "Cargando…"
              : nextDue
                ? `Próximo vencimiento: ${formatDate(nextDue.dueDate)}`
                : loans.length === 0
                  ? "No tenés libros prestados."
                  : "Sin fechas próximas."
          }
          accent={nextDue ? dueBadgeTone(nextDue.dueDate) : undefined}
        />
        <SummaryCard
          icon={<Bookmark size={18} />}
          label="Reservas activas"
          value={myReservations.isPending ? null : reservations.length}
          hint={
            myReservations.isPending
              ? "Cargando…"
              : reservations.length === 0
                ? "No tenés reservas."
                : `${reservations.filter((r) => r.status === "AVAILABLE").length} lista(s) para retirar`
          }
        />
        <SummaryCard
          icon={<History size={18} />}
          label="Préstamos totales"
          value={history.isPending ? null : historyEntries.length}
          hint={
            history.isPending
              ? "Cargando…"
              : historyEntries.length === 0
                ? "Todavía no leíste nada por acá."
                : `${historyEntries.filter((e) => e.status === "RETURNED").length} ya devueltos`
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Últimos préstamos</CardTitle>
              <p className="text-sm text-ink-muted">Tu historial más reciente.</p>
            </div>
            <Link
              to="/my-library"
              className="inline-flex items-center gap-1 text-sm font-medium text-ink underline-offset-4 hover:underline"
            >
              Ver todo <ArrowRight size={14} />
            </Link>
          </div>
          {history.isPending ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : latestHistory.length === 0 ? (
            <EmptyLine message="Cuando pidas o devuelvas un libro va a aparecer acá." />
          ) : (
            <ul className="divide-y divide-paper-edge">
              {latestHistory.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between gap-3 py-2 text-sm"
                >
                  <div>
                    <div className="font-medium text-ink">{entry.book.title}</div>
                    <div className="text-xs text-ink-muted">
                      {entry.book.author} · {formatDate(entry.loanDate)}
                    </div>
                  </div>
                  <Badge tone={entry.status === "RETURNED" ? "muted" : "success"}>
                    {entry.status === "RETURNED" ? "Devuelto" : "Activo"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="space-y-4">
          <div>
            <CardTitle>Accesos rápidos</CardTitle>
            <p className="text-sm text-ink-muted">Lo que solés usar.</p>
          </div>
          <div className="grid gap-2">
            <Link
              to="/books"
              className={buttonClassName({ variant: "primary", size: "md" })}
            >
              Explorar catálogo
            </Link>
            <Link
              to="/my-library"
              className={buttonClassName({ variant: "secondary", size: "md" })}
            >
              Ir a mi biblioteca
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

function LibrarianHome() {
  const stats = useLibraryStats();
  const data: LibraryStats | undefined = stats.data;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={<Library size={18} />}
          label="Libros en catálogo"
          value={stats.isPending ? null : (data?.totalBooks ?? 0)}
          hint="Total del acervo activo."
        />
        <SummaryCard
          icon={<BookOpen size={18} />}
          label="Préstamos activos"
          value={stats.isPending ? null : (data?.activeLoans ?? 0)}
          hint="Libros hoy fuera de la biblioteca."
        />
        <SummaryCard
          icon={<Clock size={18} />}
          label="Vencidos"
          value={stats.isPending ? null : (data?.overdueLoans ?? 0)}
          hint={
            (data?.overdueLoans ?? 0) > 0
              ? "Requieren seguimiento."
              : "Todo al día."
          }
          accent={(data?.overdueLoans ?? 0) > 0 ? "danger" : undefined}
        />
        <SummaryCard
          icon={<Users size={18} />}
          label="Socios activos"
          value={stats.isPending ? null : (data?.totalMembers ?? 0)}
          hint="Cuentas con rol MEMBER."
        />
      </div>

      <Card className="space-y-4">
        <div>
          <CardTitle>Acciones rápidas</CardTitle>
          <p className="text-sm text-ink-muted">Los atajos más usados.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <Link
            to="/books"
            className={buttonClassName({ variant: "primary", size: "md" })}
          >
            <Plus size={16} className="mr-1" /> Nuevo libro
          </Link>
          <Link
            to="/books"
            className={buttonClassName({ variant: "secondary", size: "md" })}
          >
            Ver catálogo
          </Link>
          <Link
            to="/overdue"
            className={buttonClassName({ variant: "secondary", size: "md" })}
          >
            Revisar vencidos
          </Link>
        </div>
      </Card>
    </div>
  );
}

interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | null;
  hint: string;
  accent?: "danger";
}

function SummaryCard({ icon, label, value, hint, accent }: SummaryCardProps) {
  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <span
          aria-hidden="true"
          className={
            accent === "danger"
              ? "rounded bg-accent-soft p-2 text-accent-hover"
              : "rounded bg-paper-mid p-2 text-ink"
          }
        >
          {icon}
        </span>
        <span className="text-xs uppercase tracking-widest text-ink-muted">
          {label}
        </span>
      </div>
      <div>
        {value === null ? (
          <Skeleton className="h-9 w-16" />
        ) : (
          <div className="text-3xl font-bold tracking-tight text-ink">
            {value}
          </div>
        )}
        <p className="mt-1 text-xs text-ink-muted">{hint}</p>
      </div>
    </Card>
  );
}

function EmptyLine({ message }: { message: string }) {
  return (
    <div className="rounded border border-dashed border-paper-edge bg-paper px-3 py-6 text-center text-sm text-ink-muted">
      {message}
    </div>
  );
}

function pickNextDue(loans: Loan[]): Loan | null {
  if (loans.length === 0) return null;
  return [...loans].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
  )[0];
}

function dueBadgeTone(dueDate: string): "danger" | undefined {
  const target = new Date(dueDate);
  if (Number.isNaN(target.getTime())) return undefined;
  const now = new Date();
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = startOfDay(target) - startOfDay(now);
  return diff <= 0 ? "danger" : undefined;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("es-AR");
}

