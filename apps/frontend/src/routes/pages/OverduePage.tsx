import { Link } from "react-router-dom";
import { useOverdueLoans } from "../../hooks/useLoans";
import { OverdueLoansTable } from "../../components/OverdueLoansTable/OverdueLoansTable";
import { ApiError } from "../../api/ApiError";

export function OverduePage() {
  const overdue = useOverdueLoans();

  return (
    <section className="mx-auto max-w-5xl p-8">
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-800">
          Préstamos vencidos
        </h1>
        <Link to="/books" className="text-sm text-slate-600 underline">
          Volver a libros
        </Link>
      </header>

      {overdue.isPending ? (
        <p className="text-sm text-slate-500">Cargando…</p>
      ) : overdue.isError ? (
        <p role="alert" className="text-sm text-red-600">
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
