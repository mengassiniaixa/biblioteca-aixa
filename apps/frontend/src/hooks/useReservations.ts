import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";

const MY_RESERVATIONS_KEY = "reservations/mine";
const BOOKS_KEY = "books";

export function useMyReservations(enabled = true) {
  const { api, isAuthenticated } = useAuth();
  return useQuery({
    queryKey: [MY_RESERVATIONS_KEY],
    queryFn: () => api.reservations.listMine(),
    enabled: isAuthenticated && enabled,
  });
}

export function useReserveBook() {
  const { api } = useAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (bookId: string) => api.reservations.reserve(bookId),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: [MY_RESERVATIONS_KEY] });
      client.invalidateQueries({ queryKey: [BOOKS_KEY] });
    },
  });
}

export function useCancelReservation() {
  const { api } = useAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (reservationId: string) => api.reservations.cancel(reservationId),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: [MY_RESERVATIONS_KEY] });
    },
  });
}
