import { useState, type FormEvent } from "react";
import type { Book, CreateBookRequest, UpdateBookRequest } from "../../api/types";

export type BookFormMode = "create" | "edit";

export type BookFormValues = CreateBookRequest;

interface CreatePayload {
  mode: "create";
  values: CreateBookRequest;
}
interface UpdatePayload {
  mode: "edit";
  values: UpdateBookRequest;
}
export type BookFormSubmit = CreatePayload | UpdatePayload;

interface BookFormProps {
  mode?: BookFormMode;
  initialValues?: Book;
  onSubmit: (payload: BookFormSubmit) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
}

export function BookForm({
  mode = "create",
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  errorMessage = null,
}: BookFormProps) {
  const [isbn, setIsbn] = useState(initialValues?.isbn ?? "");
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [author, setAuthor] = useState(initialValues?.author ?? "");
  const [category, setCategory] = useState(initialValues?.category ?? "");
  const [totalCopies, setTotalCopies] = useState(
    initialValues?.totalCopies?.toString() ?? "1",
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const copies = Number.parseInt(totalCopies, 10);
    if (mode === "edit") {
      onSubmit({
        mode: "edit",
        values: {
          title: title.trim(),
          author: author.trim(),
          category: category.trim(),
          totalCopies: copies,
        },
      });
      return;
    }
    onSubmit({
      mode: "create",
      values: {
        isbn: isbn.trim(),
        title: title.trim(),
        author: author.trim(),
        category: category.trim(),
        totalCopies: copies,
      },
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-3 rounded border border-slate-200 bg-white p-4 sm:grid-cols-2"
    >
      <h2 className="sm:col-span-2 text-lg font-semibold text-slate-800">
        {mode === "edit" ? "Editar libro" : "Nuevo libro"}
      </h2>

      {mode === "create" ? (
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          ISBN
          <input
            type="text"
            required
            value={isbn}
            onChange={(e) => setIsbn(e.target.value)}
            disabled={isSubmitting}
            className="rounded border border-slate-300 px-2 py-1.5 text-sm"
          />
        </label>
      ) : null}

      <label className="flex flex-col gap-1 text-sm text-slate-700">
        Título
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isSubmitting}
          className="rounded border border-slate-300 px-2 py-1.5 text-sm"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-slate-700">
        Autor
        <input
          type="text"
          required
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          disabled={isSubmitting}
          className="rounded border border-slate-300 px-2 py-1.5 text-sm"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-slate-700">
        Categoría
        <input
          type="text"
          required
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          disabled={isSubmitting}
          className="rounded border border-slate-300 px-2 py-1.5 text-sm"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-slate-700">
        Copias totales
        <input
          type="number"
          min={1}
          required
          value={totalCopies}
          onChange={(e) => setTotalCopies(e.target.value)}
          disabled={isSubmitting}
          className="rounded border border-slate-300 px-2 py-1.5 text-sm"
        />
      </label>

      {errorMessage ? (
        <p role="alert" className="sm:col-span-2 text-sm text-red-600">
          {errorMessage}
        </p>
      ) : null}

      <div className="sm:col-span-2 flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting
            ? "Guardando…"
            : mode === "edit"
              ? "Guardar cambios"
              : "Crear libro"}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            Cancelar
          </button>
        ) : null}
      </div>
    </form>
  );
}
