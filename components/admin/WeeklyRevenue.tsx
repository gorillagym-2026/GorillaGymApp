"use client";

interface Membership {
  id: string;
  plan_type: string;
  created_at: string;
  payment_method?: string;
  amount?: number;
}

interface WeeklyRevenueProps {
  memberships: Membership[];
  prices: Record<string, number>;
}

export function WeeklyRevenue({ memberships, prices }: WeeklyRevenueProps) {
  const revenueByDay: Record<
    string,
    { total: number; count: number; efectivo: number; transferencia: number; dateObj: Date }
  > = {};

  memberships.forEach((m) => {
    const dateObj = new Date(m.created_at);
    const dateKey = dateObj.toISOString().split("T")[0];

    if (!revenueByDay[dateKey]) {
      revenueByDay[dateKey] = { total: 0, count: 0, efectivo: 0, transferencia: 0, dateObj };
    }

    const amount = m.amount ?? prices[m.plan_type] ?? 0;
    revenueByDay[dateKey].total += amount;
    revenueByDay[dateKey].count += 1;

    if (m.payment_method === "efectivo") revenueByDay[dateKey].efectivo += amount;
    else if (m.payment_method === "transferencia") revenueByDay[dateKey].transferencia += amount;
  });

  const totalWeek = memberships.reduce((sum, m) => sum + (m.amount ?? prices[m.plan_type] ?? 0), 0);
  const totalEfectivo = memberships
    .filter((m) => m.payment_method === "efectivo")
    .reduce((sum, m) => sum + (m.amount ?? prices[m.plan_type] ?? 0), 0);
  const totalTransferencia = memberships
    .filter((m) => m.payment_method === "transferencia")
    .reduce((sum, m) => sum + (m.amount ?? prices[m.plan_type] ?? 0), 0);

  const days = Object.entries(revenueByDay)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dateKey, data]) => ({
      dateKey,
      label: data.dateObj.toLocaleDateString("es-AR", { weekday: "short", day: "2-digit", month: "short" }),
      ...data,
    }));

  const maxTotal = Math.max(...days.map((d) => d.total), 1);

  return (
    <div className="bg-gray-800/80 border border-gray-700/60 rounded-xl p-5 animate-fade-in-up" style={{ animationDelay: "80ms" }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-green-500/15 border border-green-500/25 flex items-center justify-center">
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-white">Ingresos de la Semana</h2>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2.5 mb-5">
        <div className="bg-green-500/8 border border-green-500/20 rounded-lg p-3">
          <p className="text-green-400/80 text-xs font-medium uppercase tracking-wider mb-1">Total</p>
          <p className="text-white text-lg font-bold leading-none">${totalWeek.toLocaleString()}</p>
        </div>
        <div className="bg-purple-500/8 border border-purple-500/20 rounded-lg p-3">
          <p className="text-purple-400/80 text-xs font-medium uppercase tracking-wider mb-1">Efectivo</p>
          <p className="text-white text-lg font-bold leading-none">${totalEfectivo.toLocaleString()}</p>
        </div>
        <div className="bg-blue-500/8 border border-blue-500/20 rounded-lg p-3">
          <p className="text-blue-400/80 text-xs font-medium uppercase tracking-wider mb-1">Transf.</p>
          <p className="text-white text-lg font-bold leading-none">${totalTransferencia.toLocaleString()}</p>
        </div>
      </div>

      {/* Daily breakdown */}
      {days.length > 0 ? (
        <div className="space-y-2">
          {days.map((day, i) => {
            const pct = Math.round((day.total / maxTotal) * 100);
            return (
              <div
                key={day.dateKey}
                className="bg-gray-900/30 border border-gray-700/30 rounded-lg p-3 hover:bg-gray-700/20 transition-all duration-150 animate-fade-in-up"
                style={{ animationDelay: `${i * 30 + 100}ms` }}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div>
                    <p className="text-white text-sm font-medium capitalize">{day.label}</p>
                    <p className="text-gray-500 text-xs">{day.count} renovación{day.count !== 1 ? "es" : ""}</p>
                  </div>
                  <p className="text-green-400 font-bold text-base flex-shrink-0">${day.total.toLocaleString()}</p>
                </div>
                {/* Progress bar */}
                <div className="h-1 bg-gray-700/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500/60 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {(day.efectivo > 0 || day.transferencia > 0) && (
                  <div className="flex gap-3 mt-2">
                    {day.efectivo > 0 && (
                      <span className="text-xs text-purple-400/80 flex items-center gap-1">
                        <span>💵</span> ${day.efectivo.toLocaleString()}
                      </span>
                    )}
                    {day.transferencia > 0 && (
                      <span className="text-xs text-blue-400/80 flex items-center gap-1">
                        <span>🏦</span> ${day.transferencia.toLocaleString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-10 h-10 rounded-full bg-gray-700/50 flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-400 text-sm">No hay ingresos esta semana</p>
        </div>
      )}
    </div>
  );
}
