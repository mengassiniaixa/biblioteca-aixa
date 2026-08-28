import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
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
    <section className="mx-auto mt-16 max-w-sm rounded border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="mb-6 text-2xl font-semibold text-slate-800">
        Crear cuenta
      </h1>
      <RegisterForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
      />
    </section>
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
