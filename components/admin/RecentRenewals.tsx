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
    mensual: "Mensual",
    diario: "Día",
    semanal: "Semanal",
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filtrar sólo los últimos 7 días
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
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Renovaciones Recientes</h2>
          <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">Últimos 7 días</span>
        </div>
        <p className="text-gray-400 text-center py-8">
          No hay renovaciones en los últimos 7 días
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-white">Renovaciones Recientes</h2>
        <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">Últimos 7 días</span>
      </div>

      {/* Resumen rápido */}
      <div className="flex items-center justify-between mb-4 p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
        <span className="text-gray-400 text-sm">{recentRenewals.length} renovación{recentRenewals.length !== 1 ? "es" : ""}</span>
        <span className="text-green-400 font-bold">${totalRecaudado.toLocaleString("es-AR")} recaudado</span>
      </div>

      <div className="space-y-1 divide-y divide-gray-700">
        {recentRenewals.map((renewal) => {
          const profile = renewal.profiles?.[0];
          const price = getPlanPrice(renewal);

          return (
            <div
              key={renewal.id}
              className="py-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">
                      {profile?.full_name?.charAt(0).toUpperCase() || "?"}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {profile?.full_name || "Usuario desconocido"}
                    </p>
                    <p className="text-gray-400 text-xs">
                      DNI: {profile?.dni || "N/A"} · {planLabels[renewal.plan_type] || renewal.plan_type}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {formatDate(renewal.created_at)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-green-400 font-bold text-lg">
                    ${price.toLocaleString("es-AR")}
                  </p>
                  <p className="text-gray-400 text-xs capitalize">
                    {renewal.payment_method}
                  </p>
                </div>
              </div>

              {/* Cobrador */}
              {renewal.collected_by && (
                <div className="mt-2 ml-13 flex items-center space-x-1 pl-13">
                  <span className="text-purple-400 text-xs">👤 Cobró:</span>
                  <span className="text-purple-300 text-xs font-medium">{renewal.collected_by}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
