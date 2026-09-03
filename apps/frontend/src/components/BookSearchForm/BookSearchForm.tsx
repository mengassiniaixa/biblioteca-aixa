import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import type { SearchBooksQuery } from "../../api/types";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

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
      className="grid grid-cols-1 gap-3 rounded border border-paper-edge bg-paper p-4 shadow-card sm:grid-cols-4"
    >
      <Input
        label="Título"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Input
        label="Autor"
        type="text"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
      />
      <Input
        label="Categoría"
        type="text"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      />
      <div className="flex items-end">
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          isLoading={isSearching}
          iconLeft={!isSearching ? <Search size={14} /> : undefined}
        >
          {isSearching ? "Buscando…" : "Buscar"}
        </Button>
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
