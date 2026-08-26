import { useState, type FormEvent } from "react";
import type { SearchBooksQuery } from "../../api/types";

interface BookSearchFormProps {
  initialValues?: SearchBooksQuery;
  onSubmit: (query: SearchBooksQuery) => void;
  isSearching?: boolean;
}

export function BookSearchForm({
  initialValues,
  onSubmit,
  isSearching = false,
}: BookSearchFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [author, setAuthor] = useState(initialValues?.author ?? "");
  const [category, setCategory] = useState(initialValues?.category ?? "");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(pickDefined({ title, author, category }));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-3 rounded border border-slate-200 bg-white p-4 sm:grid-cols-4"
    >
      <label className="flex flex-col gap-1 text-sm text-slate-700">
        Título
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded border border-slate-300 px-2 py-1.5 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-slate-700">
        Autor
        <input
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="rounded border border-slate-300 px-2 py-1.5 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-slate-700">
        Categoría
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded border border-slate-300 px-2 py-1.5 text-sm"
        />
      </label>
      <div className="flex items-end">
        <button
          type="submit"
          disabled={isSearching}
          className="w-full rounded bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSearching ? "Buscando…" : "Buscar"}
        </button>
      </div>
    </form>
  );
}

function pickDefined(values: Record<string, string>): SearchBooksQuery {
  const result: SearchBooksQuery = {};
  for (const [key, value] of Object.entries(values)) {
    const trimmed = value.trim();
    if (trimmed) result[key as keyof SearchBooksQuery] = trimmed;
  }
  return result;
}
