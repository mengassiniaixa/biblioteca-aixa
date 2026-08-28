import type { OverdueLoan } from "../../api/types";

interface OverdueLoansTableProps {
  loans: OverdueLoan[];
}

export function OverdueLoansTable({ loans }: OverdueLoansTableProps) {
  if (loans.length === 0) {
    return (
      <p className="rounded border border-slate-200 bg-white p-4 text-sm text-slate-600">
        No hay préstamos vencidos.
      </p>
    );
  }

  return (
    <table className="w-full border-collapse overflow-hidden rounded border border-slate-200 bg-white text-sm">
      <thead className="bg-slate-100 text-left text-slate-700">
        <tr>
          <th className="px-3 py-2">Libro</th>
          <th className="px-3 py-2">Socio</th>
          <th className="px-3 py-2">Prestado</th>
          <th className="px-3 py-2">Vence</th>
          <th className="px-3 py-2">Vencido hace</th>
        </tr>
      </thead>
      <tbody>
        {loans.map((loan) => (
          <tr key={loan.id} className="border-t border-slate-200">
            <td className="px-3 py-2">
              <div className="font-medium text-slate-800">{loan.book.title}</div>
              <div className="text-xs text-slate-500">{loan.book.author}</div>
            </td>
            <td className="px-3 py-2">
              <div className="text-slate-800">{loan.member.name}</div>
              <div className="text-xs text-slate-500">{loan.member.email}</div>
            </td>
            <td className="px-3 py-2 text-slate-700">
              {formatDate(loan.loanDate)}
            </td>
            <td className="px-3 py-2 text-slate-700">
              {formatDate(loan.dueDate)}
            </td>
            <td className="px-3 py-2">
              <span className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                {loan.daysOverdue} {loan.daysOverdue === 1 ? "día" : "días"}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("es-AR");
}
