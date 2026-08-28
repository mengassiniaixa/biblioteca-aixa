import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
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
    <section className="mx-auto mt-16 max-w-sm rounded border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="mb-6 text-2xl font-semibold text-slate-800">Ingresar</h1>
      <LoginForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
      />
      <p className="mt-4 text-sm text-slate-600">
        ¿No tenés cuenta?{" "}
        <Link to="/register" className="text-slate-800 underline">
          Crear cuenta
        </Link>
      </p>
    </section>
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
