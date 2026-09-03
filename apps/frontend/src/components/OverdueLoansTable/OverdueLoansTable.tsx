import type { OverdueLoan } from "../../api/types";
import { Badge } from "../ui/Badge";

interface OverdueLoansTableProps {
  loans: OverdueLoan[];
}

export function OverdueLoansTable({ loans }: OverdueLoansTableProps) {
  if (loans.length === 0) {
    return (
      <p className="rounded border border-dashed border-paper-edge bg-paper p-4 text-sm text-ink-muted">
        No hay préstamos vencidos.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded border border-paper-edge bg-paper shadow-card">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-paper-mid text-left">
          <tr className="text-xs uppercase tracking-wide text-ink-muted">
            <th className="px-3 py-2 font-medium">Libro</th>
            <th className="px-3 py-2 font-medium">Socio</th>
            <th className="px-3 py-2 font-medium">Prestado</th>
            <th className="px-3 py-2 font-medium">Vence</th>
            <th className="px-3 py-2 font-medium">Vencido hace</th>
          </tr>
        </thead>
        <tbody>
          {loans.map((loan) => (
            <tr key={loan.id} className="border-t border-paper-edge">
              <td className="px-3 py-2">
                <div className="font-medium text-ink">{loan.book.title}</div>
                <div className="text-xs text-ink-muted">{loan.book.author}</div>
              </td>
              <td className="px-3 py-2">
                <div className="text-ink">{loan.member.name}</div>
                <div className="text-xs text-ink-muted">
                  {loan.member.email}
                </div>
              </td>
              <td className="px-3 py-2 text-ink-mid">
                {formatDate(loan.loanDate)}
              </td>
              <td className="px-3 py-2 text-ink-mid">
                {formatDate(loan.dueDate)}
              </td>
              <td className="px-3 py-2">
                <Badge tone="danger">
                  {loan.daysOverdue} {loan.daysOverdue === 1 ? "día" : "días"}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("es-AR");
}
