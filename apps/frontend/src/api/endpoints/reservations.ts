import type { ApiClient } from "../client";
import type { Reservation } from "../types";

export const reservationsEndpoints = (client: ApiClient) => ({
  reserve: (bookId: string) =>
    client.request<Reservation>("reservations", {
      method: "POST",
      body: { bookId },
    }),
  cancel: (reservationId: string) =>
    client.request<Reservation>(`reservations/${reservationId}/cancel`, {
      method: "POST",
    }),
});
