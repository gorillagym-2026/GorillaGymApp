import prisma from "@/lib/prisma";

export const PLAN_FALLBACK: Record<string, number> = {
  diario: 2000,
  semanal: 6000,
  quincenal: 10000,
  mensual: 18000,
};

export { COLLECTOR_COLORS } from "@/lib/recaudacion-colors";

export const UNASSIGNED_KEY = "__sin_asignar__";

export type AdminLite = { id: string; fullName: string };

/**
 * Resuelve a qué cobrador pertenece un cobro.
 * Usa collectedById si existe; si no (cobros viejos), matchea el texto por nombre completo o primer nombre.
 */
export function makeResolver(admins: AdminLite[]) {
  const byId = new Map(admins.map((a) => [a.id, a]));
  const norm = (s: string) => s.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  return (collectedById: string | null, collectedBy: string | null): { key: string; name: string } => {
    if (collectedById && byId.has(collectedById)) {
      const a = byId.get(collectedById)!;
      return { key: a.id, name: a.fullName };
    }
    if (!collectedBy || !collectedBy.trim()) return { key: UNASSIGNED_KEY, name: "Sin asignar" };
    const n = norm(collectedBy);
    const exact = admins.find((a) => norm(a.fullName) === n);
    if (exact) return { key: exact.id, name: exact.fullName };
    const first = admins.filter((a) => norm(a.fullName).split(" ")[0] === n.split(" ")[0]);
    if (first.length === 1) return { key: first[0].id, name: first[0].fullName };
    return { key: `name:${n}`, name: collectedBy.trim() };
  };
}

/** Efectivo pendiente de rendir (histórico completo) por clave de cobrador */
export async function getPendingCash(admins: AdminLite[]) {
  const resolve = makeResolver(admins);
  const [cash, settlements, prices] = await Promise.all([
    prisma.membership.findMany({
      where: { paymentMethod: "efectivo" },
      select: { amountPaid: true, planType: true, collectedBy: true, collectedById: true },
    }),
    prisma.cashSettlement.findMany({ select: { collectorId: true, collectorName: true, amount: true } }),
    prisma.membershipPrice.findMany(),
  ]);
  const priceMap: Record<string, number> = { ...PLAN_FALLBACK, ...Object.fromEntries(prices.map((p) => [p.planType, p.price])) };
  const pending = new Map<string, number>();
  for (const m of cash) {
    const { key } = resolve(m.collectedById, m.collectedBy);
    pending.set(key, (pending.get(key) ?? 0) + (m.amountPaid ?? priceMap[m.planType] ?? 0));
  }
  for (const s of settlements) {
    const { key } = resolve(s.collectorId, s.collectorName);
    pending.set(key, (pending.get(key) ?? 0) - s.amount);
  }
  return { pending, priceMap };
}
