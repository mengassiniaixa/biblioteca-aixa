import type { Book } from "../../api/types";

interface BookListProps {
  books: Book[];
  canManage?: boolean;
  onEdit?: (book: Book) => void;
  onDelete?: (book: Book) => void;
}

export function BookList({
  books,
  canManage = false,
  onEdit,
  onDelete,
}: BookListProps) {
  if (books.length === 0) {
    return (
      <p className="rounded border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
        No hay libros para mostrar.
      </p>
    );
  }

  return (
    <table className="w-full border-collapse overflow-hidden rounded border border-slate-200 bg-white text-sm">
      <thead className="bg-slate-100 text-left text-slate-700">
        <tr>
          <th className="px-3 py-2">Título</th>
          <th className="px-3 py-2">Autor</th>
          <th className="px-3 py-2">Categoría</th>
          <th className="px-3 py-2">ISBN</th>
          <th className="px-3 py-2">Disponibles</th>
          {canManage ? <th className="px-3 py-2">Acciones</th> : null}
        </tr>
      </thead>
      <tbody>
        {books.map((book) => (
          <tr key={book.id} className="border-t border-slate-200">
            <td className="px-3 py-2 font-medium text-slate-800">{book.title}</td>
            <td className="px-3 py-2 text-slate-700">{book.author}</td>
            <td className="px-3 py-2 text-slate-700">{book.category}</td>
            <td className="px-3 py-2 text-slate-500">{book.isbn}</td>
            <td className="px-3 py-2 text-slate-700">
              {book.availableCopies} / {book.totalCopies}
            </td>
            {canManage ? (
              <td className="flex gap-2 px-3 py-2">
                <button
                  type="button"
                  onClick={() => onEdit?.(book)}
                  className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => onDelete?.(book)}
                  className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                >
                  Eliminar
                </button>
              </td>
            ) : null}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
