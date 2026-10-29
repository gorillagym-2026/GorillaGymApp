import { getSession } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { RecaudacionView, type CollectorData, type SettlementData } from "@/components/admin/RecaudacionView";
import prisma from "@/lib/prisma";
import { COLLECTOR_COLORS, getPendingCash, makeResolver, UNASSIGNED_KEY } from "@/lib/recaudacion";

// Fechas en hora Argentina (UTC-3)
const AR_OFFSET = "-03:00";
function todayAR() {
  const now = new Date(Date.now() - 3 * 60 * 60 * 1000);
  return now.toISOString().slice(0, 10);
}
function isDate(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export default async function RecaudacionPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard");

  const sp = await searchParams;
  const today = todayAR();
  const from = isDate(sp.from) ? sp.from : `${today.slice(0, 7)}-01`;
  const to = isDate(sp.to) ? sp.to : today;

  const start = new Date(`${from}T00:00:00${AR_OFFSET}`);
  const end = new Date(`${to}T00:00:00${AR_OFFSET}`);
  end.setDate(end.getDate() + 1); // fin exclusivo

  const admins = await prisma.profile.findMany({
    where: { role: "admin" },
    select: { id: true, fullName: true },
    orderBy: { createdAt: "asc" },
  });
  const resolve = makeResolver(admins);

  const [payments, settlements, { pending, priceMap }] = await Promise.all([
    prisma.membership.findMany({
      where: { createdAt: { gte: start, lt: end } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        planType: true,
        paymentMethod: true,
        amountPaid: true,
        collectedBy: true,
        collectedById: true,
        createdAt: true,
        user: { select: { fullName: true } },
      },
    }),
    prisma.cashSettlement.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
    getPendingCash(admins),
  ]);

  // Inicializar un cobrador por cada admin (aunque no tenga cobros)
  const map = new Map<string, CollectorData>();
  admins.forEach((a, i) => {
    map.set(a.id, {
      key: a.id,
      name: a.fullName,
      colorIdx: i % COLLECTOR_COLORS.length,
      isMe: a.id === session.id,
      isAdmin: true,
      efectivo: 0,
      transferencia: 0,
      count: 0,
      pending: Math.max(0, pending.get(a.id) ?? 0),
      payments: [],
    });
  });

  let extraIdx = admins.length;
  const ensure = (key: string, name: string) => {
    if (!map.has(key)) {
      map.set(key, {
        key,
        name,
        colorIdx: key === UNASSIGNED_KEY ? -1 : extraIdx++ % COLLECTOR_COLORS.length,
        isMe: false,
        isAdmin: false,
        efectivo: 0,
        transferencia: 0,
        count: 0,
        pending: key === UNASSIGNED_KEY ? 0 : Math.max(0, pending.get(key) ?? 0),
        payments: [],
      });
    }
    return map.get(key)!;
  };

  for (const p of payments) {
    const { key, name } = resolve(p.collectedById, p.collectedBy);
    const c = ensure(key, name);
    const amount = p.amountPaid ?? priceMap[p.planType] ?? 0;
    const method = p.paymentMethod === "transferencia" ? "transferencia" : "efectivo";
    c[method] += amount;
    c.count += 1;
    c.payments.push({
      id: p.id,
      date: p.createdAt.toISOString(),
      memberName: p.user.fullName,
      planType: p.planType,
      method,
      amount,
    });
  }

  // Cobradores viejos (sin usuario) que solo tienen efectivo pendiente
  for (const [key, value] of pending) {
    if (key.startsWith("name:") && value > 0) ensure(key, key.slice(5));
  }

  const collectors = [...map.values()].sort(
    (a, b) => b.efectivo + b.transferencia - (a.efectivo + a.transferencia) || b.pending - a.pending,
  );

  const colorByKey = new Map(collectors.map((c) => [c.key, c.colorIdx]));
  const settlementsData: SettlementData[] = settlements.map((s) => {
    const { key } = resolve(s.collectorId, s.collectorName);
    return {
      id: s.id,
      collectorName: s.collectorName,
      colorIdx: colorByKey.get(key) ?? -1,
      amount: s.amount,
      receivedByName: s.receivedByName,
      note: s.note,
      date: s.createdAt.toISOString(),
    };
  });

  return (
    <div className="min-h-screen bg-gray-900">
      <AdminNav userName={session.name} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 animate-fade-in-up">
          <h1 className="text-3xl font-bold text-white">Recaudación</h1>
          <p className="text-gray-400 mt-2">
            Lo cobrado por cada admin, separado en efectivo y transferencia, y el efectivo pendiente de rendir.
          </p>
        </div>
        <RecaudacionView
          from={from}
          to={to}
          today={today}
          collectors={collectors}
          settlements={settlementsData}
          myId={session.id}
        />
      </main>
    </div>
  );
}
