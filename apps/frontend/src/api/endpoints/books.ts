import type { ApiClient } from "../client";
import type {
  Book,
  CreateBookRequest,
  SearchBooksQuery,
  UpdateBookRequest,
} from "../types";

export const booksEndpoints = (client: ApiClient) => ({
  search: (query: SearchBooksQuery = {}) =>
    client.request<Book[]>("books", { query: { ...query } }),
  create: (body: CreateBookRequest) =>
    client.request<Book>("books", { method: "POST", body }),
  update: (bookId: string, body: UpdateBookRequest) =>
    client.request<Book>(`books/${bookId}`, { method: "PUT", body }),
  remove: (bookId: string) =>
    client.request<void>(`books/${bookId}`, { method: "DELETE" }),
});
