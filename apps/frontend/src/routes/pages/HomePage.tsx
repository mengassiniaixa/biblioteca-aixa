import { Link } from "react-router-dom";
import { BookOpen, Clock } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { Card, CardDescription, CardTitle } from "../../components/ui/Card";

export function HomePage() {
  const { user } = useAuth();
  const canManage = user?.role === "LIBRARIAN" || user?.role === "ADMIN";

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-wide text-ink-muted">Inicio</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">
          Hola de nuevo
        </h1>
        <p className="mt-1 text-sm text-ink-mid">
          Sesión activa como <strong>{user?.role}</strong>.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link to="/books" className="block">
          <Card interactive>
            <div className="flex items-start gap-3">
              <span className="rounded bg-paper-mid p-2 text-ink">
                <BookOpen size={20} />
              </span>
              <div>
                <CardTitle>Explorar libros</CardTitle>
                <CardDescription>
                  Buscar y {canManage ? "gestionar el catálogo" : "pedir prestado o reservar"}.
                </CardDescription>
              </div>
            </div>
          </Card>
        </Link>

        {canManage ? (
          <Link to="/overdue" className="block">
            <Card interactive>
              <div className="flex items-start gap-3">
                <span className="rounded bg-accent-soft p-2 text-accent-hover">
                  <Clock size={20} />
                </span>
                <div>
                  <CardTitle>Préstamos vencidos</CardTitle>
                  <CardDescription>
                    Revisar los préstamos activos con la fecha de devolución pasada.
                  </CardDescription>
                </div>
              </div>
            </Card>
          </Link>
        ) : null}
      </div>
    </section>
  );
}
