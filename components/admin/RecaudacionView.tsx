"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { COLLECTOR_COLORS } from "@/lib/recaudacion-colors";

export type PaymentData = {
  id: string;
  date: string;
  memberName: string;
  planType: string;
  method: "efectivo" | "transferencia";
  amount: number;
};

export type CollectorData = {
  key: string;
  name: string;
  colorIdx: number;
  isMe: boolean;
  isAdmin: boolean;
  efectivo: number;
  transferencia: number;
  count: number;
  pending: number;
  payments: PaymentData[];
};

export type SettlementData = {
  id: string;
  collectorName: string;
  colorIdx: number;
  amount: number;
  receivedByName: string;
  note: string | null;
  date: string;
};

const GRAY = {
  text: "text-gray-300", border: "border-gray-600/60", bg: "bg-gray-700/20",
  dot: "bg-gray-400", bar: "bg-gray-500", ring: "ring-gray-500/40",
};
const color = (i: number) => (i >= 0 ? COLLECTOR_COLORS[i] : GRAY);

const money = (n: number) => `$${n.toLocaleString("es-AR")}`;
const PLAN_LABEL: Record<string, string> = {
  diario: "Día", semanal: "Semanal", quincenal: "Quincenal", mensual: "Mensual",
};
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", timeZone: "America/Argentina/Buenos_Aires" });
const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("es-AR", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  });

function shiftMonth(ymd: string, delta: number) {
  const [y, m] = ymd.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 10);
}
function lastDayOfMonth(firstYmd: string) {
  const [y, m] = firstYmd.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
}

export function RecaudacionView({
  from, to, today, collectors, settlements, myId,
}: {
  from: string;
  to: string;
  today: string;
  collectors: CollectorData[];
  settlements: SettlementData[];
  myId: string;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [customFrom, setCustomFrom] = useState(from);
  const [customTo, setCustomTo] = useState(to);
  const [renderTarget, setRenderTarget] = useState<CollectorData | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const monthStart = `${today.slice(0, 7)}-01`;
  const prevStart = shiftMonth(monthStart, -1);
  const presets = [
    { label: "Hoy", from: today, to: today },
    { label: "Este mes", from: monthStart, to: today },
    { label: "Mes anterior", from: prevStart, to: lastDayOfMonth(prevStart) },
  ];
  const go = (f: string, t: string) => router.push(`/admin/recaudacion?from=${f}&to=${t}`);

  const totalEf = collectors.reduce((s, c) => s + c.efectivo, 0);
  const totalTr = collectors.reduce((s, c) => s + c.transferencia, 0);
  const totalPending = collectors.reduce((s, c) => s + c.pending, 0);
  const totalCount = collectors.reduce((s, c) => s + c.count, 0);

  const openRender = (c: CollectorData) => {
    setRenderTarget(c);
    setAmount(String(c.pending));
    setNote("");
    setError(null);
  };

  const submitRender = async () => {
    if (!renderTarget) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectorKey: renderTarget.key,
          collectorName: renderTarget.name,
          amount: Number(amount),
          note,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al registrar");
      setRenderTarget(null);
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Período */}
      <div className="bg-gray-800/80 border border-gray-700/60 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => {
            const active = p.from === from && p.to === to;
            return (
              <button
                key={p.label}
                onClick={() => go(p.from, p.to)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                  active
                    ? "bg-green-500/15 border-green-500/60 text-green-300"
                    : "bg-gray-700/40 border-gray-600/60 text-gray-300 hover:border-gray-500"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 lg:ml-auto flex-wrap">
          <input type="date" value={customFrom} max={customTo} onChange={(e) => setCustomFrom(e.target.value)}
            className="bg-gray-700/60 border border-gray-600/60 rounded-lg px-3 py-2 text-sm text-white [color-scheme:dark]" />
          <span className="text-gray-500 text-sm">a</span>
          <input type="date" value={customTo} min={customFrom} max={today} onChange={(e) => setCustomTo(e.target.value)}
            className="bg-gray-700/60 border border-gray-600/60 rounded-lg px-3 py-2 text-sm text-white [color-scheme:dark]" />
          <button onClick={() => go(customFrom, customTo)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-700 hover:bg-gray-600 text-white border border-gray-600/60">
            Ver
          </button>
        </div>
      </div>

      {/* Totales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-gray-800/80 border border-gray-700/60 rounded-xl p-4">
          <p className="text-gray-400 text-xs uppercase tracking-wide">Total del período</p>
          <p className="text-2xl font-bold text-white mt-1">{money(totalEf + totalTr)}</p>
          <p className="text-gray-500 text-xs mt-1">{totalCount} cobros</p>
        </div>
        <div className="bg-gray-800/80 border border-green-500/30 rounded-xl p-4">
          <p className="text-green-400/80 text-xs uppercase tracking-wide">💵 Efectivo</p>
          <p className="text-2xl font-bold text-green-300 mt-1">{money(totalEf)}</p>
        </div>
        <div className="bg-gray-800/80 border border-sky-500/30 rounded-xl p-4">
          <p className="text-sky-400/80 text-xs uppercase tracking-wide">🏦 Transferencia</p>
          <p className="text-2xl font-bold text-sky-300 mt-1">{money(totalTr)}</p>
        </div>
        <div className="bg-gray-800/80 border border-amber-500/40 rounded-xl p-4">
          <p className="text-amber-400/80 text-xs uppercase tracking-wide">Efectivo sin rendir</p>
          <p className="text-2xl font-bold text-amber-300 mt-1">{money(totalPending)}</p>
          <p className="text-gray-500 text-xs mt-1">en manos de los admins</p>
        </div>
      </div>

      {/* Cobradores */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {collectors.map((c) => {
          const col = color(c.colorIdx);
          const total = c.efectivo + c.transferencia;
          const efPct = total > 0 ? (c.efectivo / total) * 100 : 0;
          const isOpen = expanded === c.key;
          const canRender = c.pending > 0 && c.key !== myId && c.key !== "__sin_asignar__";
          return (
            <div key={c.key} className={`bg-gray-800/80 border ${col.border} rounded-xl overflow-hidden flex flex-col`}>
              <div className={`h-1 ${col.bar}`} />
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-3 h-3 rounded-full shrink-0 ${col.dot}`} />
                    <h3 className={`font-semibold truncate ${col.text}`}>{c.name}</h3>
                    {c.isMe && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-300 shrink-0">Vos</span>
                    )}
                  </div>
                  <span className="text-gray-500 text-xs shrink-0">{c.count} cobros</span>
                </div>

                <p className="text-3xl font-bold text-white mt-3">{money(total)}</p>

                {/* Barra efectivo / transferencia */}
                <div className="mt-3 h-2 rounded-full bg-gray-700/60 overflow-hidden flex">
                  <div className="bg-green-500" style={{ width: `${efPct}%` }} />
                  <div className="bg-sky-500" style={{ width: `${total > 0 ? 100 - efPct : 0}%` }} />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="bg-gray-900/40 rounded-lg p-2.5">
                    <p className="text-[11px] text-green-400/80">💵 Efectivo</p>
                    <p className="text-green-300 font-semibold">{money(c.efectivo)}</p>
                  </div>
                  <div className="bg-gray-900/40 rounded-lg p-2.5">
                    <p className="text-[11px] text-sky-400/80">🏦 Transferencia</p>
                    <p className="text-sky-300 font-semibold">{money(c.transferencia)}</p>
                  </div>
                </div>

                {/* Pendiente de rendir */}
                {c.key !== "__sin_asignar__" && (
                  <div className={`mt-3 rounded-lg p-3 border ${c.pending > 0 ? "border-amber-500/40 bg-amber-500/8" : "border-gray-700/60 bg-gray-900/30"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[11px] text-gray-400">Efectivo a rendir (acumulado)</p>
                        <p className={`font-bold ${c.pending > 0 ? "text-amber-300" : "text-gray-500"}`}>
                          {c.pending > 0 ? money(c.pending) : "Al día ✓"}
                        </p>
                      </div>
                      {c.pending > 0 && (
                        <button
                          onClick={() => openRender(c)}
                          disabled={!canRender}
                          title={c.key === myId ? "Tu rendición la tiene que registrar quien recibe el dinero" : ""}
                          className="px-3 py-2 rounded-lg text-xs font-semibold bg-amber-500 text-gray-900 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Registrar rendición
                        </button>
                      )}
                    </div>
                    {c.key === myId && c.pending > 0 && (
                      <p className="text-[11px] text-gray-500 mt-1.5">La registra el admin que recibe tu efectivo.</p>
                    )}
                  </div>
                )}

                {c.count > 0 && (
                  <button
                    onClick={() => setExpanded(isOpen ? null : c.key)}
                    className="mt-3 text-xs text-gray-400 hover:text-white text-left"
                  >
                    {isOpen ? "Ocultar cobros ▲" : `Ver ${c.count} cobros ▼`}
                  </button>
                )}
                {isOpen && (
                  <ul className="mt-2 divide-y divide-gray-700/50 max-h-72 overflow-y-auto">
                    {c.payments.map((p) => (
                      <li key={p.id} className="py-2 flex items-center justify-between gap-2 text-sm">
                        <div className="min-w-0">
                          <p className="text-gray-200 truncate">{p.memberName}</p>
                          <p className="text-[11px] text-gray-500">
                            {fmtDate(p.date)} · {PLAN_LABEL[p.planType] ?? p.planType}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={p.method === "efectivo" ? "text-green-300" : "text-sky-300"}>{money(p.amount)}</p>
                          <p className="text-[11px] text-gray-500">{p.method === "efectivo" ? "Efectivo" : "Transferencia"}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Historial de rendiciones */}
      <div className="bg-gray-800/80 border border-gray-700/60 rounded-xl">
        <div className="px-5 py-4 border-b border-gray-700/60">
          <h2 className="text-white font-semibold">Historial de rendiciones</h2>
          <p className="text-gray-500 text-xs mt-0.5">Últimas 30 entregas de efectivo</p>
        </div>
        {settlements.length === 0 ? (
          <p className="px-5 py-6 text-gray-500 text-sm">Todavía no se registró ninguna rendición.</p>
        ) : (
          <ul className="divide-y divide-gray-700/50">
            {settlements.map((s) => {
              const col = color(s.colorIdx);
              return (
                <li key={s.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${col.dot}`} />
                    <div className="min-w-0">
                      <p className="text-sm text-gray-200 truncate">
                        <span className={col.text}>{s.collectorName}</span>
                        <span className="text-gray-500"> rindió a </span>
                        {s.receivedByName}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate">
                        {fmtDateTime(s.date)}{s.note ? ` · ${s.note}` : ""}
                      </p>
                    </div>
                  </div>
                  <p className="text-amber-300 font-semibold shrink-0">{money(s.amount)}</p>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Modal rendición */}
      {renderTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => !saving && setRenderTarget(null)}>
          <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white font-semibold text-lg">Registrar rendición</h3>
            <p className="text-gray-400 text-sm mt-1">
              <span className={color(renderTarget.colorIdx).text}>{renderTarget.name}</span> te entrega efectivo.
              Pendiente: <span className="text-amber-300 font-semibold">{money(renderTarget.pending)}</span>
            </p>
            <label className="block text-gray-300 text-sm mt-4 mb-1">Monto recibido</label>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={renderTarget.pending}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
            />
            <label className="block text-gray-300 text-sm mt-3 mb-1">Nota (opcional)</label>
            <input
              type="text"
              value={note}
              maxLength={200}
              placeholder="Ej: cierre de octubre"
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
            />
            {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
            <div className="flex gap-2 mt-5">
              <button onClick={() => setRenderTarget(null)} disabled={saving}
                className="flex-1 py-2.5 rounded-lg bg-gray-700 text-gray-200 hover:bg-gray-600 text-sm">
                Cancelar
              </button>
              <button onClick={submitRender} disabled={saving || !Number(amount)}
                className="flex-1 py-2.5 rounded-lg bg-amber-500 text-gray-900 font-semibold hover:bg-amber-400 disabled:opacity-50 text-sm">
                {saving ? "Guardando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
