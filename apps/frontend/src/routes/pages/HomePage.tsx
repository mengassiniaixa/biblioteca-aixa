import { useAuth } from "../../auth/AuthContext";

export function HomePage() {
  const { user, logout } = useAuth();
  return (
    <section className="mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-semibold text-slate-800">
        biblioteca-aixa
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Sesión iniciada como <strong>{user?.role}</strong>.
      </p>
      <button
        type="button"
        onClick={logout}
        className="mt-4 rounded bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
      >
        Cerrar sesión
      </button>
    </section>
  );
}
