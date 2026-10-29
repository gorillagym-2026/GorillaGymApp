"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Price {
  id: string;
  plan_type: string;
  price: number;
  price_overdue: number | null;
  updated_at: string;
}
interface PriceSettingsProps {
  prices: Price[];
}

export function PriceSettings({ prices }: PriceSettingsProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const planLabels: Record<string, string> = {
    diario: "Día",
    semanal: "Semanal",
    quincenal: "Quincenal",
    mensual: "Mensual",
  };
  const planSubLabels: Record<string, string> = {
    diario: "1 día",
    semanal: "7 días",
    quincenal: "15 días",
    mensual: "30 días",
  };
  const planColors: Record<string, { bg: string; border: string; text: string; bar: string }> = {
    diario:    { bg: "bg-orange-500/8",  border: "border-orange-500/20", text: "text-orange-400",  bar: "bg-orange-400" },
    semanal:   { bg: "bg-blue-500/8",    border: "border-blue-500/20",   text: "text-blue-400",    bar: "bg-blue-400" },
    quincenal: { bg: "bg-purple-500/8",  border: "border-purple-500/20", text: "text-purple-400",  bar: "bg-purple-400" },
    mensual:   { bg: "bg-green-500/8",   border: "border-green-500/20",  text: "text-green-400",   bar: "bg-green-400" },
  };
  const planIcons: Record<string, React.ReactNode> = {
    diario: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    semanal: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    quincenal: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    mensual: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  };

  const planOrder = ["diario", "semanal", "quincenal", "mensual"];

  // Estado local: { planType: { price, priceOverdue } }
  const initPriceState = () =>
    prices.reduce(
      (acc, p) => ({
        ...acc,
        [p.plan_type]: { price: p.price, priceOverdue: p.price_overdue ?? 0 },
      }),
      {} as Record<string, { price: number; priceOverdue: number }>,
    );

  const [localPrices, setLocalPrices] = useState<Record<string, { price: number; priceOverdue: number }>>(
    initPriceState,
  );

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      // Construir payload con ambos precios
      const payload: Record<string, { price: number; priceOverdue: number | null }> = {};
      for (const planType of planOrder) {
        const vals = localPrices[planType] || { price: 0, priceOverdue: 0 };
        payload[planType] = {
          price: vals.price,
          priceOverdue: vals.priceOverdue > 0 ? vals.priceOverdue : null,
        };
      }
      const res = await fetch("/api/prices", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prices: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(true);
      setEditing(false);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setLocalPrices(initPriceState());
    setEditing(false);
    setError(null);
  };

  const visiblePrices = planOrder.map((planType) => {
    const existing = prices.find((p) => p.plan_type === planType);
    return (
      existing || {
        id: planType,
        plan_type: planType,
        price: 0,
        price_overdue: null,
        updated_at: new Date().toISOString(),
      }
    );
  });

  return (
    <div
      className="bg-gray-800/80 border border-gray-700/60 rounded-xl p-5 animate-fade-in-up"
      style={{ animationDelay: "160ms" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-yellow-500/15 border border-yellow-500/25 flex items-center justify-center">
            <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-white leading-none mb-0.5">Precios de Membresías</h2>
            <p className="text-gray-500 text-xs">En término y vencido</p>
          </div>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-all duration-150 border border-blue-500/30"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Editar precios
          </button>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 bg-red-500/8 border border-red-500/20 rounded-lg p-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-4 bg-green-500/8 border border-green-500/20 rounded-lg p-3 flex items-center gap-2 animate-fade-in">
          <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-green-400 text-sm">Precios actualizados correctamente</p>
        </div>
      )}

      {/* Price cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {visiblePrices.map((price) => {
          const c = planColors[price.plan_type] || planColors.mensual;
          const vals = localPrices[price.plan_type] || { price: price.price, priceOverdue: price.price_overdue ?? 0 };

          return (
            <div
              key={price.plan_type}
              className={`relative rounded-xl p-4 border transition-all duration-200 overflow-hidden ${
                editing
                  ? "border-blue-500/30 bg-blue-500/5 ring-1 ring-blue-500/20"
                  : `${c.border} ${c.bg}`
              }`}
            >
              {/* Top accent bar */}
              <div className={`absolute top-0 left-0 right-0 h-0.5 ${c.bar} opacity-50`} />

              {/* Plan header */}
              <div className="flex items-center gap-2.5 mb-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${c.bg} border ${c.border} ${c.text}`}>
                  {planIcons[price.plan_type]}
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm leading-none mb-0.5">
                    {planLabels[price.plan_type] || price.plan_type}
                  </h3>
                  <p className="text-gray-500 text-xs">{planSubLabels[price.plan_type] || ""}</p>
                </div>
              </div>

              {editing ? (
                <div className="space-y-3">
                  {/* Precio en término */}
                  <div>
                    <label className="block text-xs font-medium mb-1 text-green-400/80 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      En término
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        value={vals.price || ""}
                        onChange={(e) =>
                          setLocalPrices({
                            ...localPrices,
                            [price.plan_type]: { ...vals, price: parseInt(e.target.value) || 0 },
                          })
                        }
                        className="w-full pl-7 pr-3 py-2 bg-gray-900/60 border border-green-500/30 rounded-lg text-white text-lg font-bold focus:outline-none focus:ring-1 focus:ring-green-400/50 transition-all placeholder:text-gray-600"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  {/* Precio vencido */}
                  <div>
                    <label className="block text-xs font-medium mb-1 text-red-400/80 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Vencido
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        value={vals.priceOverdue || ""}
                        onChange={(e) =>
                          setLocalPrices({
                            ...localPrices,
                            [price.plan_type]: { ...vals, priceOverdue: parseInt(e.target.value) || 0 },
                          })
                        }
                        className="w-full pl-7 pr-3 py-2 bg-gray-900/60 border border-red-500/30 rounded-lg text-white text-lg font-bold focus:outline-none focus:ring-1 focus:ring-red-400/50 transition-all placeholder:text-gray-600"
                        placeholder="Igual que en término"
                      />
                    </div>
                    <p className="text-gray-600 text-xs mt-1">Dejá en 0 para usar el mismo precio</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* En término */}
                  <div className="bg-gray-900/40 border border-gray-700/30 rounded-lg p-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      <p className="text-gray-500 text-xs">En término</p>
                    </div>
                    <p className={`font-bold text-lg ${c.text}`}>
                      ${vals.price.toLocaleString()}
                    </p>
                  </div>
                  {/* Vencido */}
                  <div className="bg-gray-900/40 border border-gray-700/30 rounded-lg p-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                      <p className="text-gray-500 text-xs">Vencido</p>
                    </div>
                    {vals.priceOverdue > 0 ? (
                      <p className="font-bold text-lg text-red-400">
                        ${vals.priceOverdue.toLocaleString()}
                      </p>
                    ) : (
                      <p className="text-gray-600 text-sm italic">= En término</p>
                    )}
                  </div>
                  <p className="text-gray-600 text-xs">
                    Actualizado {new Date(price.updated_at).toLocaleDateString("es-AR")}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit actions */}
      {editing && (
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-700/40">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="px-4 py-2 border border-gray-600/40 text-gray-400 rounded-lg hover:bg-gray-700/40 text-sm transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-green-600/80 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 border border-green-500/30 flex items-center gap-1.5"
          >
            {loading ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Guardando...
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Guardar cambios
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
