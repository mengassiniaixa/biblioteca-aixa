import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export function HomePage() {
  const { user, logout } = useAuth();
  return (
    <section className="mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-semibold text-slate-800">biblioteca-aixa</h1>
      <p className="mt-2 text-sm text-slate-600">
        Sesión iniciada como <strong>{user?.role}</strong>.
      </p>
      <div className="mt-4 flex gap-2">
        <Link
          to="/books"
          className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
        >
          Ver libros
        </Link>
        <button
          type="button"
          onClick={logout}
          className="rounded bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
        >
          Cerrar sesión
        </button>
      </div>
    </section>
  );
}
