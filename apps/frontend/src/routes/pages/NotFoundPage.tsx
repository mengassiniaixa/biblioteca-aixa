import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="py-16 text-center">
      <p className="text-xs uppercase tracking-widest text-ink-muted">Error 404</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-ink">
        Página no encontrada
      </h1>
      <p className="mt-2 text-sm text-ink-mid">
        La URL a la que intentaste ir no existe.
      </p>
      <Link
        to="/"
        className="mt-6 inline-block text-sm font-medium text-ink underline underline-offset-4 hover:text-accent"
      >
        Volver al inicio
      </Link>
    </section>
  );
}
