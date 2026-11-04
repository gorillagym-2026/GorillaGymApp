import { fmtDateOnly, money, PLAN_LABELS } from "@/lib/membership";

export interface HistoryItem {
  id: string;
  planType: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  paymentMethod: string | null;
  amount: number | null;
  isCurrent: boolean;
  isExpired: boolean;
}

export function MembershipHistory({ items }: { items: HistoryItem[] }) {
  const total = items.reduce((s, m) => s + (m.amount ?? 0), 0);

  return (
    <div className="bg-gray-800/80 border border-gray-700/60 rounded-xl">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700/60">
        <div>
          <h2 className="text-white font-semibold">Historial de pagos</h2>
          <p className="text-gray-500 text-xs mt-0.5">
            {items.length} pago{items.length !== 1 ? "s" : ""}
          </p>
        </div>
        {items.length > 0 && (
          <div className="text-right">
            <p className="text-gray-500 text-[11px] uppercase tracking-wider">Total pagado</p>
            <p className="text-green-400 font-bold">{money(total)}</p>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <p className="px-5 py-8 text-center text-gray-500 text-sm">Todavía no hay pagos registrados</p>
      ) : (
        <ul className="divide-y divide-gray-700/50 max-h-[420px] overflow-y-auto">
          {items.map((m) => (
            <li key={m.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white text-sm font-medium">{PLAN_LABELS[m.planType] ?? m.planType}</p>
                  {m.isCurrent && !m.isExpired && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-400 font-medium">Vigente</span>
                  )}
                  {m.isCurrent && m.isExpired && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 font-medium">Vencida</span>
                  )}
                </div>
                <p className="text-gray-500 text-xs mt-0.5">
                  {fmtDateOnly(m.startDate)} – {fmtDateOnly(m.endDate)}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-white text-sm font-semibold">{m.amount != null ? money(m.amount) : "—"}</p>
                <p className="text-gray-500 text-xs">
                  {m.paymentMethod === "transferencia" ? "🏦 Transferencia" : m.paymentMethod === "efectivo" ? "💵 Efectivo" : "Sin método"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
