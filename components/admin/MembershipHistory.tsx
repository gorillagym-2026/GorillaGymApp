"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Membership {
  id: string;
  plan_type: string;
  start_date: string;
  end_date: string;
  status: string;
  payment_method?: string;
  created_at: string;
  amount_paid?: number | null;
}

interface MembershipHistoryProps {
  memberships: Membership[];
  memberName: string;
  prices: Record<string, number>;
}

export function MembershipHistory({
  memberships,
  memberName,
  prices,
}: MembershipHistoryProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDates, setEditDates] = useState<{
    start_date: string;
    end_date: string;
  }>({ start_date: "", end_date: "" });
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const planLabels: Record<string, string> = {
    quincenal: "Quincenal",
    mensual: "Mensual",
    diario: "Día",
    semanal: "Semanal",
    trimestral: "Trimestral",
    anual: "Anual",
  };

  const paymentMethodLabels: Record<string, string> = {
    efectivo: "Efectivo",
    transferencia: "Transferencia",
  };

  const paymentMethodIcons: Record<string, string> = {
    efectivo: "💵",
    transferencia: "🏦",
  };

  const getPlanPrice = (m: Membership): number => {
    return m.amount_paid ?? prices[m.plan_type] ?? 0;
  };

  const getStatusBadge = (status: string, endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    const isExpired = end < today || status === "expired";

    if (status === "active" && !isExpired) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/15 text-green-400 border border-green-500/25 rounded-full text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          Activa
        </span>
      );
    }
    if (isExpired || status === "expired") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-500/15 text-gray-400 border border-gray-500/25 rounded-full text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
          Finalizada
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/15 text-red-400 border border-red-500/25 rounded-full text-xs font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
        Suspendida
      </span>
    );
  };

  const getDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleStartEdit = (m: Membership) => {
    setEditingId(m.id);
    setEditDates({ start_date: m.start_date, end_date: m.end_date });
    setEditError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditError(null);
  };

  const handleSaveEdit = async (membershipId: string) => {
    setSavingId(membershipId);
    setEditError(null);
    try {
      const res = await fetch(`/api/memberships/${membershipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editDates),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEditingId(null);
      router.refresh();
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  if (memberships.length === 0) {
    return (
      <div className="bg-gray-800/80 border border-gray-700/60 rounded-xl p-6 animate-fade-in-up">
        <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <span className="text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </span>
          Historial de Renovaciones
        </h2>
        <div className="text-center py-10">
          <div className="w-12 h-12 rounded-full bg-gray-700/50 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-400 text-sm">No hay registros de renovaciones</p>
        </div>
      </div>
    );
  }

  const totalPagado = memberships.reduce((sum, m) => sum + getPlanPrice(m), 0);
  const totalRenovaciones = memberships.length;
  const porEfectivo = memberships.filter((m) => m.payment_method === "efectivo").length;
  const porTransferencia = memberships.filter((m) => m.payment_method === "transferencia").length;

  return (
    <div className="bg-gray-800/80 border border-gray-700/60 rounded-xl p-6 animate-fade-in-up" style={{ animationDelay: "120ms" }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-white">Historial de Renovaciones</h2>
        <span className="ml-auto text-xs font-medium bg-gray-700/60 text-gray-400 px-2 py-0.5 rounded-full border border-gray-600/40">
          {totalRenovaciones} registros
        </span>
      </div>

      {/* Stats mini-grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="bg-blue-500/8 border border-blue-500/20 rounded-lg p-3">
          <p className="text-blue-400/80 text-xs font-medium uppercase tracking-wider mb-1.5">Renovaciones</p>
          <p className="text-white text-xl font-bold">{totalRenovaciones}</p>
        </div>
        <div className="bg-green-500/8 border border-green-500/20 rounded-lg p-3">
          <p className="text-green-400/80 text-xs font-medium uppercase tracking-wider mb-1.5">Recaudado</p>
          <p className="text-white text-xl font-bold">${totalPagado.toLocaleString()}</p>
        </div>
        <div className="bg-purple-500/8 border border-purple-500/20 rounded-lg p-3">
          <p className="text-purple-400/80 text-xs font-medium uppercase tracking-wider mb-1.5">💵 Efectivo</p>
          <p className="text-white text-xl font-bold">{porEfectivo}</p>
        </div>
        <div className="bg-orange-500/8 border border-orange-500/20 rounded-lg p-3">
          <p className="text-orange-400/80 text-xs font-medium uppercase tracking-wider mb-1.5">🏦 Transf.</p>
          <p className="text-white text-xl font-bold">{porTransferencia}</p>
        </div>
      </div>

      {/* History list */}
      <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
        {memberships.map((membership, index) => {
          const isEditing = editingId === membership.id;
          const isSaving = savingId === membership.id;
          const currentStart = isEditing ? editDates.start_date : membership.start_date;
          const currentEnd = isEditing ? editDates.end_date : membership.end_date;
          const duration = getDuration(currentStart, currentEnd);
          const amount = getPlanPrice(membership);
          const isActive = membership.status === "active" && new Date(membership.end_date) >= new Date();

          return (
            <div
              key={membership.id}
              className={`rounded-xl p-4 border transition-all duration-200 animate-fade-in-up ${
                isActive
                  ? "border-green-500/25 bg-green-500/5"
                  : "border-gray-700/40 bg-gray-900/30"
              } ${isEditing ? "ring-1 ring-blue-500/40" : ""}`}
              style={{ animationDelay: `${index * 40}ms` }}
            >
              {/* Card header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    isActive ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-gray-700/60 text-gray-400 border border-gray-600/40"
                  }`}>
                    #{memberships.length - index}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-white font-semibold text-sm">
                        {planLabels[membership.plan_type] || membership.plan_type}
                      </h3>
                      {getStatusBadge(membership.status, membership.end_date)}
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {new Date(membership.created_at).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-green-400 font-bold text-lg leading-none">${amount.toLocaleString()}</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      ${duration > 0 ? (amount / duration).toFixed(0) : "—"}/día
                    </p>
                  </div>
                  {!isEditing && (
                    <button
                      onClick={() => handleStartEdit(membership)}
                      className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all duration-150 border border-transparent hover:border-blue-500/20"
                      title="Editar fechas"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Edit error */}
              {isEditing && editError && (
                <div className="mb-3 bg-red-500/8 border border-red-500/20 rounded-lg p-2.5">
                  <p className="text-red-400 text-xs">{editError}</p>
                </div>
              )}

              {/* Dates grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="bg-gray-900/40 border border-gray-700/30 rounded-lg p-2.5">
                  <p className="text-gray-500 text-xs mb-1">Inicio</p>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editDates.start_date}
                      onChange={(e) => setEditDates({ ...editDates, start_date: e.target.value })}
                      className="w-full bg-gray-800/60 border border-blue-500/40 rounded px-2 py-1 text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                    />
                  ) : (
                    <p className="text-white font-medium text-xs">
                      {new Date(membership.start_date + "T12:00:00").toLocaleDateString("es-AR")}
                    </p>
                  )}
                </div>

                <div className="bg-gray-900/40 border border-gray-700/30 rounded-lg p-2.5">
                  <p className="text-gray-500 text-xs mb-1">Vencimiento</p>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editDates.end_date}
                      onChange={(e) => setEditDates({ ...editDates, end_date: e.target.value })}
                      className="w-full bg-gray-800/60 border border-blue-500/40 rounded px-2 py-1 text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                    />
                  ) : (
                    <p className="text-white font-medium text-xs">
                      {new Date(membership.end_date + "T12:00:00").toLocaleDateString("es-AR")}
                    </p>
                  )}
                </div>

                <div className="bg-gray-900/40 border border-gray-700/30 rounded-lg p-2.5">
                  <p className="text-gray-500 text-xs mb-1">Duración</p>
                  <p className="text-white font-medium text-xs">{duration} días</p>
                </div>

                <div className="bg-gray-900/40 border border-gray-700/30 rounded-lg p-2.5">
                  <p className="text-gray-500 text-xs mb-1">Método</p>
                  <p className="text-white font-medium text-xs flex items-center gap-1">
                    <span>{membership.payment_method ? paymentMethodIcons[membership.payment_method] : "💳"}</span>
                    <span className="capitalize">
                      {membership.payment_method ? paymentMethodLabels[membership.payment_method] : "N/E"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Edit actions */}
              {isEditing && (
                <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-700/40">
                  <button
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="px-3 py-1.5 border border-gray-600/40 text-gray-400 rounded-lg hover:bg-gray-700/40 text-xs transition-all disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleSaveEdit(membership.id)}
                    disabled={isSaving}
                    className="px-3 py-1.5 bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-all disabled:opacity-50 border border-blue-500/30 flex items-center gap-1.5"
                  >
                    {isSaving ? (
                      <>
                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Guardar fechas
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Footer */}
              {!isEditing && (
                <div className="pt-2.5 mt-2.5 border-t border-gray-700/30 flex items-center justify-between">
                  <span className="text-gray-600 text-xs font-mono">
                    {membership.id.slice(0, 8)}…
                  </span>
                  {isActive && (
                    <span className="text-green-400/80 text-xs font-medium">
                      Vigente hasta {new Date(membership.end_date + "T12:00:00").toLocaleDateString("es-AR")}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary footer */}
      <div className="mt-4 pt-4 border-t border-gray-700/40 flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-0.5">Promedio por renovación</p>
          <p className="text-white text-lg font-bold">
            ${Math.round(totalPagado / totalRenovaciones).toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-0.5">Última renovación</p>
          <p className="text-white text-sm font-medium">
            {new Date(memberships[0].created_at).toLocaleDateString("es-AR")}
          </p>
        </div>
      </div>
    </div>
  );
}
