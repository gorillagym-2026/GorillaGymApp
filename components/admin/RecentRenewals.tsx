interface RecentRenewal {
  id: string;
  plan_type: string;
  payment_method: string;
  created_at: string;
  amount_paid?: number | null;
  collected_by?: string | null;
  profiles:
    | {
        id: string;
        full_name: string;
        dni: string;
      }[]
    | null;
}

interface RecentRenewalsProps {
  renewals: RecentRenewal[];
  prices: Record<string, number>;
}

export function RecentRenewals({ renewals, prices }: RecentRenewalsProps) {
  const getPlanPrice = (renewal: RecentRenewal): number => {
    return renewal.amount_paid ?? prices[renewal.plan_type] ?? 0;
  };

  const planLabels: Record<string, string> = {
    quincenal: "Quincenal",
    mensual:   "Mensual",
    diario:    "Día",
    semanal:   "Semanal",
  };

  const methodIcon: Record<string, string> = {
    efectivo:     "💵",
    transferencia: "🏦",
    debito:       "💳",
    credito:      "💳",
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filtrar últimos 7 días
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const recentRenewals = renewals.filter(
    (r) => new Date(r.created_at) >= sevenDaysAgo,
  );

  const totalRecaudado = recentRenewals.reduce(
    (sum, r) => sum + getPlanPrice(r),
    0,
  );

  if (!recentRenewals || recentRenewals.length === 0) {
    return (
      <div className="bg-gray-800/80 border border-gray-700/60 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Renovaciones Recientes</h2>
          <span className="text-xs text-gray-400 bg-gray-700/80 border border-gray-600/50 px-2.5 py-1 rounded-full">
            Últimos 7 días
          </span>
        </div>
        <p className="text-gray-500 text-center py-8 text-sm">
          No hay renovaciones en los últimos 7 días
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/80 border border-gray-700/60 rounded-xl p-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">Renovaciones Recientes</h2>
        <span className="text-xs text-gray-400 bg-gray-700/80 border border-gray-600/50 px-2.5 py-1 rounded-full">
          Últimos 7 días
        </span>
      </div>

      {/* Resumen */}
      <div className="flex items-center justify-between mb-5 p-3 bg-green-500/8 border border-green-500/20 rounded-lg">
        <div className="flex items-center gap-1.5 text-gray-400 text-sm">
          <span className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-xs">
            {recentRenewals.length}
          </span>
          renovación{recentRenewals.length !== 1 ? "es" : ""}
        </div>
        <span className="text-green-400 font-bold text-sm">
          ${totalRecaudado.toLocaleString("es-AR")} recaudado
        </span>
      </div>

      {/* List */}
      <div className="space-y-2">
        {recentRenewals.map((renewal, i) => {
          const profile = renewal.profiles?.[0];
          const price   = getPlanPrice(renewal);
          const initial = (profile?.full_name ?? "?").charAt(0).toUpperCase();

          return (
            <div
              key={renewal.id}
              className="group flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700/40 transition-all duration-150 border border-transparent hover:border-gray-600/40 animate-fade-in-up"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm shadow-sm">
                {initial}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {profile?.full_name ?? "Usuario desconocido"}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-gray-400 text-xs">
                    DNI {profile?.dni ?? "N/A"}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-gray-600 inline-block" />
                  <span className="text-blue-400/80 text-xs">
                    {planLabels[renewal.plan_type] ?? renewal.plan_type}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-gray-600 inline-block" />
                  <span className="text-gray-500 text-xs">
                    {formatDate(renewal.created_at)}
                  </span>
                </div>
                {renewal.collected_by && (
                  <p className="text-purple-400/80 text-xs mt-0.5 flex items-center gap-1">
                    <span>👤</span>
                    <span>{renewal.collected_by}</span>
                  </p>
                )}
              </div>

              {/* Price + method */}
              <div className="text-right flex-shrink-0">
                <p className="text-green-400 font-bold text-base">
                  ${price.toLocaleString("es-AR")}
                </p>
                <p className="text-gray-500 text-xs capitalize flex items-center gap-1 justify-end">
                  <span>{methodIcon[renewal.payment_method] ?? "💳"}</span>
                  <span>{renewal.payment_method}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
