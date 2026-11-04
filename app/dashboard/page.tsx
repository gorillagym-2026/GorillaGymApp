import { getSession } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { UserNav } from "@/components/user/UserNav";
import Link from "next/link";
import prisma from "@/lib/prisma";
import {
  fmtDateOnly,
  getMembershipState,
  money,
  PLAN_LABELS,
  STATE_STYLES,
  todayAR,
} from "@/lib/membership";

export const revalidate = 0;
export const dynamic = "force-dynamic";

const Chevron = ({ className = "" }: { className?: string }) => (
  <svg className={`w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

function routineHref(id: string, category: string | null) {
  const c = (category ?? "").toLowerCase();
  return `/dashboard/routines/${c.startsWith("mujer") ? "women" : "men"}/${id}`;
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "admin") redirect("/admin");

  const [profile, membership, assignments] = await Promise.all([
    prisma.profile.findUnique({ where: { id: session.id }, select: { fullName: true } }),
    prisma.membership.findFirst({ where: { userId: session.id }, orderBy: { endDate: "desc" } }),
    prisma.routineAssignment.findMany({
      where: { userId: session.id },
      orderBy: { assignedAt: "desc" },
      include: {
        routine: {
          select: {
            id: true,
            name: true,
            category: true,
            description: true,
            days: { select: { id: true, _count: { select: { exercises: true } } } },
          },
        },
      },
    }),
  ]);

  const priceRecord = membership
    ? await prisma.membershipPrice.findUnique({ where: { planType: membership.planType } })
    : null;

  const state = getMembershipState(membership?.endDate, membership?.status);
  const st = STATE_STYLES[state.key];
  const userName = profile?.fullName || session.name || "Usuario";

  // Progreso del período actual
  let progress = 0;
  if (membership) {
    const start = new Date(membership.startDate).getTime();
    const end = new Date(membership.endDate).getTime();
    const now = todayAR().getTime();
    progress = end > start ? Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100)) : 100;
  }

  const price = priceRecord?.price ?? null;
  const overdue = priceRecord?.priceOverdue && priceRecord.priceOverdue > 0 ? priceRecord.priceOverdue : null;
  const hasOverduePrice = price != null && overdue != null && overdue > price;

  return (
    <div className="min-h-screen bg-gray-950">
      <UserNav userName={userName} />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Saludo */}
        <div className="animate-fade-in-up">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
            Hola, <span className="text-green-400">{userName.split(" ")[0]}</span> 💪
          </h1>
          <p className="text-gray-500 text-sm">Tu centro de entrenamiento</p>
        </div>

        {/* Membresía */}
        <section className={`animate-fade-in-up ${st.bg} border ${st.border} rounded-xl overflow-hidden`}>
          <div className={`h-1 ${st.bar} opacity-70`} />
          <div className="p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Tu membresía</p>
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${st.text}`}>
                <span className={`w-2 h-2 rounded-full ${st.dot}`} />
                {state.label}
              </span>
            </div>
            <p className={`text-2xl font-bold mt-2 ${state.key === "active" ? "text-white" : st.text}`}>{state.detail}</p>

            {membership && (
              <>
                <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-sm">
                  <p className="text-gray-400">
                    Plan <span className="text-white font-medium">{PLAN_LABELS[membership.planType] ?? membership.planType}</span>
                  </p>
                  <p className="text-gray-400">
                    Vence <span className="text-white font-medium">{fmtDateOnly(membership.endDate)}</span>
                  </p>
                </div>
                {state.key !== "expired" && (
                  <div className="mt-4 h-1.5 rounded-full bg-gray-700/60 overflow-hidden">
                    <div className={`h-full ${st.bar}`} style={{ width: `${progress}%` }} />
                  </div>
                )}
              </>
            )}

            {/* Aviso de precio */}
            {membership && price != null && (
              <div className="mt-4 rounded-lg bg-gray-900/50 border border-gray-700/50 p-3.5 text-sm">
                {state.isOverdue ? (
                  <>
                    <p className="text-white font-medium">
                      Para renovar: <span className="text-red-300">{money(overdue ?? price)}</span>
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      {hasOverduePrice
                        ? `Se aplica el precio con vencimiento. Renovando a tiempo pagás ${money(price)}.`
                        : "Acercate al gym para renovar."}
                    </p>
                  </>
                ) : hasOverduePrice ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-gray-300">
                        <span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-2" />
                        Renovando hasta el {fmtDateOnly(membership.endDate, { day: "2-digit", month: "2-digit" })}
                      </p>
                      <p className="text-green-300 font-semibold">{money(price)}</p>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-gray-400">
                        <span className="inline-block w-2 h-2 rounded-full bg-red-400 mr-2" />
                        Después del vencimiento
                      </p>
                      <p className="text-red-300 font-semibold">{money(overdue!)}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-300">
                    Precio de renovación: <span className="text-white font-semibold">{money(price)}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Tu rutina */}
        <section className="animate-fade-in-up" style={{ animationDelay: "60ms" }}>
          <h2 className="text-xs font-semibold text-gray-300 mb-3 uppercase tracking-wider">
            {assignments.length > 1 ? "Tus rutinas" : "Tu rutina"}
          </h2>
          {assignments.length > 0 ? (
            <div className="space-y-3">
              {assignments.map(({ routine }) => {
                const exCount = routine.days.reduce((s, d) => s + d._count.exercises, 0);
                return (
                  <Link
                    key={routine.id}
                    href={routineHref(routine.id, routine.category)}
                    className="group flex items-center gap-4 bg-gradient-to-br from-green-900/30 to-gray-800/60 border border-green-600/40 hover:border-green-500/70 rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-green-500/10"
                  >
                    <div className="w-12 h-12 rounded-xl bg-green-500/15 border border-green-500/30 flex items-center justify-center text-2xl shrink-0">
                      🏋️
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-green-400/80 text-[11px] uppercase tracking-wider font-semibold">Asignada por tu profe</p>
                      <h3 className="text-white font-semibold truncate group-hover:text-green-300 transition-colors">{routine.name}</h3>
                      <p className="text-gray-400 text-xs mt-0.5">
                        {routine.days.length} día{routine.days.length !== 1 ? "s" : ""} · {exCount} ejercicio{exCount !== 1 ? "s" : ""}
                        {routine.category ? ` · ${routine.category}` : ""}
                      </p>
                    </div>
                    <Chevron className="text-gray-500 group-hover:text-green-400" />
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="bg-gray-800/40 border border-dashed border-gray-700 rounded-xl p-5 text-center">
              <p className="text-gray-300 text-sm font-medium">Todavía no tenés una rutina asignada</p>
              <p className="text-gray-500 text-xs mt-1">Pedísela a tu profe. Mientras tanto, podés usar las rutinas generales.</p>
            </div>
          )}
        </section>

        {/* Rutinas generales */}
        <section className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <h2 className="text-xs font-semibold text-gray-300 mb-3 uppercase tracking-wider">Rutinas generales</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/dashboard/routines/men"
              className="group bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-700/40 hover:border-blue-500/60 rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5"
            >
              <span className="text-3xl mb-3 block">💪</span>
              <h3 className="text-white font-semibold mb-1 group-hover:text-blue-300 transition-colors text-sm">Hombres</h3>
              <p className="text-gray-500 text-xs flex items-center gap-1">Ver programa <Chevron className="w-3 h-3" /></p>
            </Link>
            <Link
              href="/dashboard/routines/women"
              className="group bg-gradient-to-br from-pink-900/30 to-pink-800/20 border border-pink-700/40 hover:border-pink-500/60 rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5"
            >
              <span className="text-3xl mb-3 block">🏋️‍♀️</span>
              <h3 className="text-white font-semibold mb-1 group-hover:text-pink-300 transition-colors text-sm">Mujeres</h3>
              <p className="text-gray-500 text-xs flex items-center gap-1">Ver programa <Chevron className="w-3 h-3" /></p>
            </Link>
          </div>
        </section>

        {/* Biblioteca */}
        <section className="animate-fade-in-up" style={{ animationDelay: "140ms" }}>
          <Link
            href="/dashboard/exercises"
            className="group flex items-center justify-between bg-gray-800/60 border border-gray-700/40 hover:border-green-500/40 rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/15 flex items-center justify-center text-xl">📚</div>
              <div>
                <h3 className="text-white font-semibold text-sm group-hover:text-green-400 transition-colors">Biblioteca de ejercicios</h3>
                <p className="text-gray-500 text-xs">Explorá por grupo muscular</p>
              </div>
            </div>
            <Chevron className="text-gray-600 group-hover:text-green-400" />
          </Link>
        </section>
      </main>
    </div>
  );
}
