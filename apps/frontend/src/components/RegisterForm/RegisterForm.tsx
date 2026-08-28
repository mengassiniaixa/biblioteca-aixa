import { useState, type FormEvent } from "react";

export interface RegisterFormValues {
  name: string;
  email: string;
  password: string;
}

interface RegisterFormProps {
  onSubmit: (values: RegisterFormValues) => void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
}

export function RegisterForm({
  onSubmit,
  isSubmitting = false,
  errorMessage = null,
}: RegisterFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({ name: name.trim(), email: email.trim(), password });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="register-name" className="text-sm text-slate-700">
          Nombre
        </label>
        <input
          id="register-name"
          name="name"
          type="text"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSubmitting}
          className="rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="register-email" className="text-sm text-slate-700">
          Email
        </label>
        <input
          id="register-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
          className="rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="register-password" className="text-sm text-slate-700">
          Contraseña
        </label>
        <input
          id="register-password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isSubmitting}
          className="rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        />
      </div>

      {errorMessage ? (
        <p role="alert" className="text-sm text-red-600">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Creando cuenta…" : "Crear cuenta"}
      </button>
    </form>
  );
}
