"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Membership {
  id: string;
  plan_type: string;
  start_date: string;
  end_date: string;
  status: "active" | "expired" | "suspended";
  payment_method?: string;
}

interface PriceData {
  price: number;
  priceOverdue: number | null;
}

interface MemberMembershipSimpleProps {
  membership: Membership | null;
  memberId: string;
  /** precios en término: { mensual: 23000, diario: 2000, ... } */
  prices: Record<string, number>;
  /** precios vencidos: { mensual: 25000, diario: 2500, ... } — puede estar vacío */
  pricesOverdue?: Record<string, number | null>;
}

type StartMode = "today" | "from_expiry" | "custom";

const COBRADORES = ["Milton", "Fabricio", "Otro"];

export function MemberMembershipSimple({
  membership,
  memberId,
  prices,
  pricesOverdue = {},
}: MemberMembershipSimpleProps) {
  const router = useRouter();
  const [showRenewForm, setShowRenewForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState("mensual");
  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "transferencia">("efectivo");
  const [startMode, setStartMode] = useState<StartMode>("today");
  const [customDate, setCustomDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [collectedBy, setCollectedBy] = useState<string>("");
  const [customCollector, setCustomCollector] = useState<string>("");

  const planLabels: Record<string, string> = {
    diario: "Día",
    semanal: "Semanal",
    quincenal: "Quincenal",
    mensual: "Mensual",
  };
  const planDurations: Record<string, number> = {
    diario: 1,
    semanal: 7,
    quincenal: 15,
    mensual: 30,
  };
  const planOrder = ["diario", "semanal", "quincenal", "mensual"];

  // ─── Estado de vencimiento ────────────────────────────────
  const isMembershipExpired = (): boolean => {
    if (!membership) return false; // sin membresía = nuevo socio, no vencido
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(membership.end_date);
    endDate.setHours(0, 0, 0, 0);
    return endDate < today || membership.status === "expired";
  };
  const isExpired = isMembershipExpired();

  // ─── Precio a mostrar según estado ───────────────────────
  const getEffectivePrice = (plan: string): { amount: number; isOverdue: boolean } => {
    const normalPrice = prices[plan] ?? 0;
    const overduePrice = pricesOverdue[plan];
    if (isExpired && overduePrice != null && overduePrice > 0) {
      return { amount: overduePrice, isOverdue: true };
    }
    return { amount: normalPrice, isOverdue: false };
  };

  // ─── Fechas ───────────────────────────────────────────────
  const getStartDate = (): Date => {
    if (startMode === "from_expiry" && membership?.end_date) {
      const expiry = new Date(membership.end_date + "T12:00:00");
      expiry.setDate(expiry.getDate() + 1);
      return expiry;
    }
    if (startMode === "custom") return new Date(customDate + "T12:00:00");
    return new Date();
  };
  const calculateEndDate = (planType: string): string => {
    const end = new Date(getStartDate());
    if (planType === "diario") end.setDate(end.getDate() + 1);
    else if (planType === "semanal") end.setDate(end.getDate() + 7);
    else if (planType === "quincenal") end.setDate(end.getDate() + 15);
    else if (planType === "mensual") end.setMonth(end.getMonth() + 1);
    return end.toISOString().split("T")[0];
  };

  // ─── Submit ───────────────────────────────────────────────
  const handleRenew = async () => {
    setLoading(true);
    setError(null);
    try {
      const startDate = getStartDate().toISOString().split("T")[0];
      const finalCollector = collectedBy === "Otro" ? customCollector : collectedBy;
      const res = await fetch("/api/memberships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: memberId,
          planType: selectedPlan,
          paymentMethod,
          currentMembershipId: membership?.id || null,
          startDate,
          collectedBy: finalCollector || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowRenewForm(false);
      setCollectedBy("");
      setCustomCollector("");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Estado de la membresía activa ───────────────────────
  const getDaysRemaining = () => {
    if (!membership) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(membership.end_date);
    endDate.setHours(0, 0, 0, 0);
    return Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };
  const getStatusDisplay = () => {
    const d = getDaysRemaining();
    if (d === null) return { color: "text-gray-400", text: "Sin membresía", bg: "bg-gray-500/10 border-gray-500" };
    if (d < 0) return { color: "text-red-400", text: `Venció hace ${Math.abs(d)} día${Math.abs(d) !== 1 ? "s" : ""}`, bg: "bg-red-500/10 border-red-500" };
    if (d === 0) return { color: "text-orange-400", text: "Vence HOY", bg: "bg-orange-500/10 border-orange-500" };
    if (d <= 3) return { color: "text-orange-400", text: `Vence en ${d} día${d !== 1 ? "s" : ""}`, bg: "bg-orange-500/10 border-orange-500" };
    return { color: "text-green-400", text: `${d} días restantes`, bg: "bg-green-500/10 border-green-500" };
  };
  const status = getStatusDisplay();
  const daysRemaining = getDaysRemaining();

  const startModes: { value: StartMode; label: string; description: string }[] = [
    { value: "today", label: "Desde hoy", description: `Inicia ${new Date().toLocaleDateString("es-AR")}` },
    ...(membership
      ? [
          {
            value: "from_expiry" as StartMode,
            label: "Desde vencimiento",
            description: (() => {
              const d = new Date(membership.end_date + "T12:00:00");
              d.setDate(d.getDate() + 1);
              return `Inicia ${d.toLocaleDateString("es-AR")}`;
            })(),
          },
        ]
      : []),
    { value: "custom", label: "Fecha personalizada", description: "Elegí el día de inicio" },
  ];

  return (
    <div className="bg-gray-800/80 border border-gray-700/60 rounded-xl p-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Membresía</h2>
        {!showRenewForm && (
          <button
            onClick={() => setShowRenewForm(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors font-medium"
          >
            {membership ? "Renovar" : "Crear"}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {showRenewForm ? (
        <div className="space-y-6">

          {/* Alerta precio vencido */}
          {isExpired && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="text-red-400 font-semibold text-sm">Socio vencido — precio especial aplicado</p>
                <p className="text-red-300/70 text-xs mt-0.5">
                  El precio vencido se aplica automáticamente y no puede bajarse.
                </p>
              </div>
            </div>
          )}

          {/* Cobrador */}
          <div>
            <label className="block text-white font-medium mb-3 text-sm">
              ¿Quién recibió el pago?{" "}
              <span className="text-gray-400 font-normal">(cobrador)</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {COBRADORES.map((nombre) => (
                <button
                  key={nombre}
                  type="button"
                  onClick={() => setCollectedBy(collectedBy === nombre ? "" : nombre)}
                  className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                    collectedBy === nombre
                      ? "border-purple-500 bg-purple-500/10 text-white"
                      : "border-gray-600 bg-gray-700/50 hover:border-gray-500 text-gray-300"
                  }`}
                >
                  {nombre}
                </button>
              ))}
            </div>
            {collectedBy === "Otro" && (
              <input
                type="text"
                placeholder="Nombre del cobrador..."
                value={customCollector}
                onChange={(e) => setCustomCollector(e.target.value)}
                className="mt-2 w-full p-3 rounded-lg border-2 border-purple-500 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 text-sm"
              />
            )}
          </div>

          {/* Método de pago */}
          <div>
            <label className="block text-white font-medium mb-3 text-sm">Método de Pago</label>
            <div className="grid grid-cols-2 gap-3">
              {(["efectivo", "transferencia"] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    paymentMethod === method
                      ? "border-green-500 bg-green-500/10"
                      : "border-gray-600 bg-gray-700/50 hover:border-gray-500"
                  }`}
                >
                  <span className="text-white font-medium">
                    {method === "efectivo" ? "Efectivo" : "Transferencia"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Fecha de inicio */}
          <div>
            <label className="block text-white font-medium mb-3 text-sm">Fecha de Inicio</label>
            <div className="space-y-2">
              {startModes.map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => setStartMode(mode.value)}
                  className={`w-full p-3 rounded-lg border-2 transition-all text-left flex items-center justify-between ${
                    startMode === mode.value
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-gray-600 bg-gray-700/50 hover:border-gray-500"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        startMode === mode.value ? "border-blue-500 bg-blue-500" : "border-gray-500"
                      }`}
                    >
                      {startMode === mode.value && <span className="text-white text-[8px]">✓</span>}
                    </span>
                    <span className="text-white font-medium text-sm">{mode.label}</span>
                  </div>
                  <span className="text-gray-400 text-xs">{mode.description}</span>
                </button>
              ))}
            </div>
            {startMode === "custom" && (
              <input
                type="date"
                value={customDate}
                min="2020-01-01"
                onChange={(e) => setCustomDate(e.target.value)}
                className="mt-3 w-full p-3 rounded-lg border-2 border-blue-500 bg-gray-700 text-white focus:outline-none"
              />
            )}
          </div>

          {/* Planes */}
          <div>
            <label className="block text-white font-medium mb-3 text-sm">Plan de Membresía</label>
            <div className="space-y-3">
              {planOrder.map((plan) => {
                const { amount, isOverdue } = getEffectivePrice(plan);
                const normalAmount = prices[plan] ?? 0;
                const overdueAmount = pricesOverdue[plan];
                const isSelected = selectedPlan === plan;
                const endDatePreview = calculateEndDate(plan);

                return (
                  <button
                    key={plan}
                    type="button"
                    onClick={() => setSelectedPlan(plan)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? isOverdue
                          ? "border-red-500 bg-red-500/8"
                          : "border-green-500 bg-green-500/8"
                        : "border-gray-600 bg-gray-700/50 hover:border-gray-500"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? isOverdue
                              ? "border-red-500 bg-red-500"
                              : "border-green-500 bg-green-500"
                            : "border-gray-500"
                        }`}
                      >
                        {isSelected && <span className="text-white text-xs">✓</span>}
                      </span>
                      <p className="text-white font-bold">{planLabels[plan] || plan}</p>
                      {isOverdue && isSelected && (
                        <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/15 text-red-400 border border-red-500/25 rounded-full text-xs font-medium">
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          Precio vencido
                        </span>
                      )}
                    </div>
                    <div className="ml-8 space-y-1">
                      {/* Precio bloqueado si vencido */}
                      {isOverdue ? (
                        <div className="flex items-center gap-2">
                          <p className="text-red-400 font-bold text-xl">${amount.toLocaleString()}</p>
                          {overdueAmount != null && overdueAmount > 0 && (
                            <p className="text-gray-600 text-sm line-through">${normalAmount.toLocaleString()}</p>
                          )}
                          <div title="Precio bloqueado por vencimiento" className="ml-1">
                            <svg className="w-4 h-4 text-red-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>
                        </div>
                      ) : (
                        <p className="text-green-400 font-bold text-xl">${amount.toLocaleString()}</p>
                      )}
                      <p className="text-gray-400 text-sm">
                        {planDurations[plan]} día{planDurations[plan] !== 1 ? "s" : ""}
                      </p>
                      {isSelected && (
                        <p className="text-blue-400 text-sm font-medium">
                          Vence:{" "}
                          {new Date(endDatePreview + "T12:00:00").toLocaleDateString("es-AR")}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Resumen del precio seleccionado cuando está vencido */}
            {isExpired && (() => {
              const { amount, isOverdue } = getEffectivePrice(selectedPlan);
              return isOverdue ? (
                <div className="mt-3 bg-red-500/8 border border-red-500/20 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-red-400 text-sm font-medium">
                      Monto a cobrar (bloqueado)
                    </span>
                  </div>
                  <span className="text-red-400 font-bold text-lg">${amount.toLocaleString()}</span>
                </div>
              ) : null;
            })()}
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
            <button
              onClick={() => { setShowRenewForm(false); setError(null); setCollectedBy(""); setCustomCollector(""); }}
              disabled={loading}
              className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={handleRenew}
              disabled={loading}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 font-medium text-sm"
            >
              {loading ? "Procesando..." : membership ? "Confirmar Renovación" : "Crear Membresía"}
            </button>
          </div>
        </div>
      ) : membership ? (
        <div className="space-y-6">
          <div className={`rounded-xl p-6 text-center border-2 ${status.bg}`}>
            <p className="text-gray-300 text-sm mb-2">Estado de Membresía</p>
            <p className={`text-2xl font-bold ${status.color}`}>{status.text}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900/40 border border-gray-700/30 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Plan</p>
              <p className="text-white font-bold text-lg">
                {planLabels[membership.plan_type] || membership.plan_type}
              </p>
              <p className="text-green-400 font-semibold">
                ${prices[membership.plan_type]?.toLocaleString() || "—"}
              </p>
            </div>
            <div className="bg-gray-900/40 border border-gray-700/30 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Vencimiento</p>
              <p className="text-white font-bold text-lg">
                {new Date(membership.end_date).toLocaleDateString("es-AR")}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900/40 border border-gray-700/30 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Inicio</p>
              <p className="text-white">
                {new Date(membership.start_date).toLocaleDateString("es-AR")}
              </p>
            </div>
            {membership.payment_method && (
              <div className="bg-gray-900/40 border border-gray-700/30 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-1">Método de Pago</p>
                <p className="text-white capitalize">{membership.payment_method}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg mb-4">Este alumno no tiene membresía</p>
          <button
            onClick={() => setShowRenewForm(true)}
            className="text-green-400 hover:text-green-300 font-medium"
          >
            Crear membresía →
          </button>
        </div>
      )}
    </div>
  );
}
