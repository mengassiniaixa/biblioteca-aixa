import { useState, type FormEvent } from "react";
import type { Book, CreateBookRequest, UpdateBookRequest } from "../../api/types";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

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
      className="grid grid-cols-1 gap-4 rounded border border-paper-edge bg-paper p-5 shadow-card sm:grid-cols-2"
    >
      <h2 className="sm:col-span-2 text-lg font-semibold text-ink">
        {mode === "edit" ? "Editar libro" : "Nuevo libro"}
      </h2>

      {mode === "create" ? (
        <Input
          label="ISBN"
          type="text"
          required
          value={isbn}
          onChange={(e) => setIsbn(e.target.value)}
          disabled={isSubmitting}
        />
      ) : null}

      <Input
        label="Título"
        type="text"
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={isSubmitting}
      />

      <Input
        label="Autor"
        type="text"
        required
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        disabled={isSubmitting}
      />

      <Input
        label="Categoría"
        type="text"
        required
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        disabled={isSubmitting}
      />

      <Input
        label="Copias totales"
        type="number"
        min={1}
        required
        value={totalCopies}
        onChange={(e) => setTotalCopies(e.target.value)}
        disabled={isSubmitting}
      />

      {errorMessage ? (
        <p role="alert" className="sm:col-span-2 text-sm text-accent">
          {errorMessage}
        </p>
      ) : null}

      <div className="sm:col-span-2 flex gap-2">
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Guardando…"
            : mode === "edit"
              ? "Guardar cambios"
              : "Crear libro"}
        </Button>
        {onCancel ? (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
        ) : null}
      </div>
    </form>
  );
}
