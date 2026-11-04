// Lógica compartida de estado de membresía (alumno y admin).
// Las fechas de membresía son @db.Date → llegan como medianoche UTC.
// Comparamos contra "hoy" en Argentina expresado también como medianoche UTC.

export const SOON_DAYS = 3; // a partir de cuántos días se considera "por vencer"

export const PLAN_LABELS: Record<string, string> = {
  diario: "Día",
  semanal: "Semanal",
  quincenal: "Quincenal",
  mensual: "Mensual",
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function todayAR(): Date {
  const ar = new Date(Date.now() - 3 * 60 * 60 * 1000);
  return new Date(Date.UTC(ar.getUTCFullYear(), ar.getUTCMonth(), ar.getUTCDate()));
}

function toUTCDate(d: Date | string): Date {
  const x = new Date(d);
  return new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate()));
}

export type MembershipStateKey = "none" | "expired" | "today" | "soon" | "active";

export type MembershipState = {
  key: MembershipStateKey;
  label: string;
  /** días hasta el vencimiento (negativo si ya venció) */
  days: number | null;
  detail: string;
  isOverdue: boolean;
};

export function getMembershipState(endDate: Date | string | null | undefined, status?: string | null): MembershipState {
  if (!endDate) {
    return { key: "none", label: "Sin membresía", days: null, detail: "Acercate al gym para activarla", isOverdue: false };
  }
  const days = Math.round((toUTCDate(endDate).getTime() - todayAR().getTime()) / DAY_MS);
  if (days < 0 || status === "expired") {
    const n = Math.abs(Math.min(days, 0));
    return {
      key: "expired",
      label: "Vencida",
      days,
      detail: n === 0 ? "Venció" : `Venció hace ${n} día${n !== 1 ? "s" : ""}`,
      isOverdue: true,
    };
  }
  if (days === 0) return { key: "today", label: "Vence hoy", days, detail: "Último día para renovar en término", isOverdue: false };
  if (days <= SOON_DAYS)
    return { key: "soon", label: "Por vencer", days, detail: `Vence en ${days} día${days !== 1 ? "s" : ""}`, isOverdue: false };
  return { key: "active", label: "Activa", days, detail: `${days} días restantes`, isOverdue: false };
}

/** Formatea una fecha @db.Date sin correrla de día por zona horaria */
export function fmtDateOnly(d: Date | string, opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit", year: "numeric" }) {
  return new Date(d).toLocaleDateString("es-AR", { ...opts, timeZone: "UTC" });
}

export const money = (n: number) => `$${n.toLocaleString("es-AR")}`;

/** Clases por estado (completas para Tailwind) */
export const STATE_STYLES: Record<MembershipStateKey, { text: string; border: string; bg: string; bar: string; dot: string }> = {
  none:    { text: "text-gray-300",   border: "border-gray-600/50",   bg: "bg-gray-800/60",   bar: "bg-gray-500",   dot: "bg-gray-400" },
  expired: { text: "text-red-400",    border: "border-red-500/40",    bg: "bg-red-500/8",     bar: "bg-red-500",    dot: "bg-red-400" },
  today:   { text: "text-orange-400", border: "border-orange-500/40", bg: "bg-orange-500/8",  bar: "bg-orange-500", dot: "bg-orange-400" },
  soon:    { text: "text-yellow-400", border: "border-yellow-500/40", bg: "bg-yellow-500/8",  bar: "bg-yellow-500", dot: "bg-yellow-400" },
  active:  { text: "text-green-400",  border: "border-green-500/40",  bg: "bg-green-500/8",   bar: "bg-green-500",  dot: "bg-green-400" },
};
