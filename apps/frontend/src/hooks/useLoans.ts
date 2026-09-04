import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";

const MY_LOANS_KEY = "loans/mine";
const MY_LOAN_HISTORY_KEY = "loans/mine/history";
const OVERDUE_LOANS_KEY = "loans/overdue";
const BOOKS_KEY = "books";

export function useMyLoans(enabled = true) {
  const { api, isAuthenticated } = useAuth();
  return useQuery({
    queryKey: [MY_LOANS_KEY],
    queryFn: () => api.loans.listMine(),
    enabled: isAuthenticated && enabled,
  });
}

export function useMyLoanHistory(enabled = true) {
  const { api, isAuthenticated } = useAuth();
  return useQuery({
    queryKey: [MY_LOAN_HISTORY_KEY],
    queryFn: () => api.loans.history(),
    enabled: isAuthenticated && enabled,
  });
}

export function useOverdueLoans(enabled = true) {
  const { api, isAuthenticated } = useAuth();
  return useQuery({
    queryKey: [OVERDUE_LOANS_KEY],
    queryFn: () => api.loans.overdue(),
    enabled: isAuthenticated && enabled,
  });
}

export function useLoanBook() {
  const { api } = useAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (bookId: string) => api.loans.loan(bookId),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: [MY_LOANS_KEY] });
      client.invalidateQueries({ queryKey: [MY_LOAN_HISTORY_KEY] });
      client.invalidateQueries({ queryKey: [BOOKS_KEY] });
    },
  });
}

export function useReturnLoan() {
  const { api } = useAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (loanId: string) => api.loans.return(loanId),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: [MY_LOANS_KEY] });
      client.invalidateQueries({ queryKey: [MY_LOAN_HISTORY_KEY] });
      client.invalidateQueries({ queryKey: [BOOKS_KEY] });
      client.invalidateQueries({ queryKey: ["reservations/mine"] });
    },
  });
}
