import { useOverdueLoans } from "../../hooks/useLoans";
import { OverdueLoansTable } from "../../components/OverdueLoansTable/OverdueLoansTable";
import { ApiError } from "../../api/ApiError";

export function OverduePage() {
  const overdue = useOverdueLoans();

  return (
    <section className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-widest text-ink-muted">
          Bibliotecarixs
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">
          Préstamos vencidos
        </h1>
        <p className="mt-1 text-sm text-ink-mid">
          Préstamos activos cuya fecha de devolución ya pasó.
        </p>
      </header>

      {overdue.isPending ? (
        <p className="text-sm text-ink-muted">Cargando…</p>
      ) : overdue.isError ? (
        <p role="alert" className="text-sm text-accent">
          {toErrorMessage(overdue.error)}
        </p>
      ) : (
        <OverdueLoansTable loans={overdue.data ?? []} />
      )}
    </section>
  );
}

function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 403) {
    return "No tenés permisos para ver esta página";
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "No pudimos cargar los préstamos vencidos";
}
