import { createApiClient, type TokenGetter } from "./client";
import { authEndpoints } from "./endpoints/auth";
import { booksEndpoints } from "./endpoints/books";
import { loansEndpoints } from "./endpoints/loans";
import { reservationsEndpoints } from "./endpoints/reservations";
import { statsEndpoints } from "./endpoints/stats";

export function createApi(getToken: TokenGetter) {
  const client = createApiClient(getToken);
  return {
    auth: authEndpoints(client),
    books: booksEndpoints(client),
    loans: loansEndpoints(client),
    reservations: reservationsEndpoints(client),
    stats: statsEndpoints(client),
  };
}

export type Api = ReturnType<typeof createApi>;
export { ApiError } from "./ApiError";
export type * from "./types";
