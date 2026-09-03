import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Library } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { LoginForm, type LoginFormValues } from "../../components/LoginForm/LoginForm";
import { ApiError } from "../../api/ApiError";

interface LocationState {
  from?: string;
}

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const from = (location.state as LocationState | null)?.from ?? "/";

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async ({ email, password }: LoginFormValues) => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-paper-soft">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 lg:grid-cols-2">
        <aside className="hidden bg-ink px-10 py-16 text-paper lg:flex lg:flex-col lg:justify-between">
          <Link
            to="/books"
            className="flex items-center gap-2 font-bold tracking-tight"
          >
            <Library size={22} strokeWidth={2.25} />
            <span>Sistema de biblioteca</span>
          </Link>
          <div className="max-w-md">
            <p className="text-xs uppercase tracking-widest text-paper/60">
              Ingresá
            </p>
            <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight">
              Volvé a tu biblioteca.
            </h1>
            <p className="mt-4 text-sm text-paper/70">
              Gestioná préstamos, reservas y el catálogo con una interfaz
              minimal.
            </p>
          </div>
          <p className="text-xs text-paper/50">© Sistema de biblioteca</p>
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
              Cuenta
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">
              Ingresar
            </h2>
            <p className="mt-1 text-sm text-ink-mid">
              Accedé con tu email y contraseña.
            </p>

            <div className="mt-6">
              <LoginForm
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                errorMessage={errorMessage}
              />
            </div>

            <p className="mt-6 text-sm text-ink-mid">
              ¿No tenés cuenta?{" "}
              <Link
                to="/register"
                className="font-medium text-ink underline underline-offset-4 hover:text-accent"
              >
                Crear cuenta
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 401) {
    return "Credenciales inválidas";
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "No se pudo iniciar sesión";
}
