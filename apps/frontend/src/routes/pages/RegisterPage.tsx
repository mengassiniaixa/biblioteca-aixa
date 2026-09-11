import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { BookOpen, Bookmark, CheckCircle2, Library } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import {
  RegisterForm,
  type RegisterFormValues,
} from "../../components/RegisterForm/RegisterForm";
import { ApiError } from "../../api/ApiError";

export function RegisterPage() {
  const { api, login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (isAuthenticated) {
    return <Navigate to="/books" replace />;
  }

  const handleSubmit = async ({
    name,
    email,
    password,
  }: RegisterFormValues) => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await api.auth.register({ name, email, password });
      await login(email, password);
      navigate("/books", { replace: true });
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-paper-soft">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <aside className="relative hidden overflow-hidden bg-ink px-10 py-16 text-paper lg:flex lg:flex-col lg:justify-between">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-24 -top-16 h-72 w-72 rounded-full bg-accent/10 blur-3xl animate-float-slow"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-paper/5 blur-2xl animate-float-slow"
            style={{ animationDelay: "-3s" }}
          />

          <Link
            to="/books"
            className="relative flex items-center gap-2 font-bold tracking-tight"
          >
            <Library size={22} strokeWidth={2.25} />
            <span>Sistema de biblioteca</span>
          </Link>

          <div className="relative max-w-md animate-fade-up">
            <p className="text-xs uppercase tracking-widest text-paper/60">
              Sumate
            </p>
            <h1 className="mt-3 text-5xl font-bold leading-[1.05] tracking-tight text-paper sm:text-6xl">
              Empezá a <br />
              <span className="text-accent">leer</span>.
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-paper/70">
              Creá tu cuenta gratuita y llevate un libro a casa hoy mismo.
            </p>

            <ul className="mt-8 space-y-3 text-sm text-paper/80">
              <FeatureItem icon={<BookOpen size={16} />}>
                Pedí libros del catálogo con un click
              </FeatureItem>
              <FeatureItem icon={<Bookmark size={16} />}>
                Reservá los que ya están prestados
              </FeatureItem>
              <FeatureItem icon={<CheckCircle2 size={16} />}>
                Seguí tu historial de lecturas
              </FeatureItem>
            </ul>
          </div>

          <p className="relative text-xs text-paper/50">© Sistema de biblioteca</p>
        </aside>

        <section className="flex items-center justify-center px-6 py-16 sm:px-10">
          <div className="w-full max-w-sm">
            <Link
              to="/books"
              className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-ink lg:hidden"
            >
              <Library size={18} strokeWidth={2.25} />
              Sistema de biblioteca
            </Link>
            <p className="text-xs uppercase tracking-widest text-ink-muted">
              Nueva cuenta
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">
              Crear cuenta
            </h2>
            <p className="mt-1 text-sm text-ink-mid">
              Tomate unos segundos y sumate al sistema.
            </p>

            <div className="mt-6">
              <RegisterForm
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                errorMessage={errorMessage}
              />
            </div>

            <p className="mt-6 text-sm text-ink-mid">
              ¿Ya tenés cuenta?{" "}
              <Link
                to="/login"
                className="font-medium text-ink underline underline-offset-4 hover:text-accent"
              >
                Ingresar
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function FeatureItem({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper/10 text-paper"
      >
        {icon}
      </span>
      <span>{children}</span>
    </li>
  );
}

function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 409) {
    return "Ese email ya está registrado";
  }
  if (error instanceof ApiError && error.status === 400) {
    return "Datos inválidos, revisá los campos";
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "No se pudo crear la cuenta";
}
