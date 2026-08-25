import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-semibold text-slate-800">404</h1>
      <p className="mt-2 text-sm text-slate-600">Página no encontrada.</p>
      <Link to="/" className="mt-4 inline-block text-sm text-sky-700 underline">
        Volver al inicio
      </Link>
    </section>
  );
}
