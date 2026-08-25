import type { ApiClient } from "../client";
import type { Loan, ReturnBookResponse } from "../types";

export const loansEndpoints = (client: ApiClient) => ({
  loan: (bookId: string) =>
    client.request<Loan>("loans", { method: "POST", body: { bookId } }),
  return: (loanId: string) =>
    client.request<ReturnBookResponse>(`loans/${loanId}/return`, {
      method: "POST",
    }),
  overdue: () => client.request<Loan[]>("loans/overdue"),
});
