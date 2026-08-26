import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";
import type {
  Book,
  CreateBookRequest,
  SearchBooksQuery,
  UpdateBookRequest,
} from "../api/types";

const BOOKS_KEY = "books";

export function useSearchBooks(query: SearchBooksQuery) {
  const { api } = useAuth();
  return useQuery({
    queryKey: [BOOKS_KEY, query],
    queryFn: () => api.books.search(query),
  });
}

export function useCreateBook() {
  const { api } = useAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateBookRequest) => api.books.create(body),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: [BOOKS_KEY] });
    },
  });
}

export function useUpdateBook() {
  const { api } = useAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateBookRequest }) =>
      api.books.update(id, body),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: [BOOKS_KEY] });
    },
  });
}

export function useDeleteBook() {
  const { api } = useAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (book: Book) => api.books.remove(book.id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: [BOOKS_KEY] });
    },
  });
}
