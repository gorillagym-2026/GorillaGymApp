import { getSession } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { UserNav } from "@/components/user/UserNav";
import Link from "next/link";
import prisma from "@/lib/prisma";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "admin") redirect("/admin");

  const [profile, membership] = await Promise.all([
    prisma.profile.findUnique({
      where: { id: session.id },
      select: { fullName: true, role: true },
    }),
    prisma.membership.findFirst({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const today = new Date();
  const daysRemaining = membership
    ? Math.ceil((membership.endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const statusConfig = (() => {
    if (!membership)
      return { label: "Sin Membresía", color: "gray", icon: "⚠️", expired: false };
    if (daysRemaining! < 0)
      return { label: "Vencida", color: "red",    icon: "🔴", expired: true  };
    if (daysRemaining! <= 7)
      return { label: "Por Vencer", color: "yellow", icon: "⚠️", expired: false };
    return   { label: "Activa",      color: "green",  icon: "✅", expired: false };
  })();

  const borderClass: Record<string, string> = {
    gray:   "border-gray-600/40",
    red:    "border-red-500/40",
    yellow: "border-yellow-500/40",
    green:  "border-green-500/40",
  };
  const bgClass: Record<string, string> = {
    gray:   "bg-gray-800/60",
    red:    "bg-red-500/8",
    yellow: "bg-yellow-500/8",
    green:  "bg-green-500/8",
  };
  const textClass: Record<string, string> = {
    gray:   "text-gray-400",
    red:    "text-red-400",
    yellow: "text-yellow-400",
    green:  "text-green-400",
  };

  const userName = profile?.fullName || session.name || "Usuario";

  return (
    <div className="min-h-screen bg-gray-950">
      <UserNav userName={userName} />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Greeting */}
        <div className="animate-fade-in-up">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
            Hola, <span className="text-green-400">{userName.split(" ")[0]}</span> 💪
          </h1>
          <p className="text-gray-500 text-sm">Tu centro de entrenamiento</p>
        </div>

        {/* Membership status cards */}
        <div className="grid grid-cols-2 gap-3 stagger-children">
          {/* Estado */}
          <div
            className={`animate-fade-in-up col-span-1 ${bgClass[statusConfig.color]} border ${borderClass[statusConfig.color]} rounded-xl p-5 relative overflow-hidden`}
          >
            <div className={`absolute top-0 left-0 right-0 h-0.5 ${
              statusConfig.color === "green" ? "bg-green-500" :
              statusConfig.color === "yellow" ? "bg-yellow-500" :
              statusConfig.color === "red" ? "bg-red-500" : "bg-gray-600"
            } opacity-70`} />
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Estado</p>
            <p className={`text-xl font-bold ${textClass[statusConfig.color]} mb-1`}>
              {statusConfig.label}
            </p>
            <p className="text-gray-500 text-xs">
              {!membership
                ? "Contactá al gym"
                : daysRemaining! < 0
                  ? `Venció hace ${Math.abs(daysRemaining!)}d`
                  : `${daysRemaining} días restantes`}
            </p>
          </div>

          {/* Vencimiento */}
          <div className="animate-fade-in-up bg-gray-800/60 border border-gray-700/40 rounded-xl p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500/50" />
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Vencimiento</p>
            <p className="text-xl font-bold text-white mb-1">
              {membership?.endDate
                ? membership.endDate.toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "2-digit",
                  })
                : "N/A"}
            </p>
            <p className="text-gray-500 text-xs">Fecha de vencimiento</p>
          </div>
        </div>

        {/* Rutinas */}
        <div className="animate-fade-in-up" style={{ animationDelay: "80ms" }}>
          <h2 className="text-base font-semibold text-gray-300 mb-3 uppercase tracking-wider text-xs">
            Rutinas de Entrenamiento
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/dashboard/routines/men"
              className="group bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-700/40 hover:border-blue-500/60 rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/10"
            >
              <span className="text-4xl mb-3 block">💪</span>
              <h3 className="text-white font-semibold mb-1 group-hover:text-blue-300 transition-colors text-sm">
                Rutinas Hombres
              </h3>
              <p className="text-gray-500 text-xs flex items-center gap-1">
                Ver programa
                <svg className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </p>
            </Link>

            <Link
              href="/dashboard/routines/women"
              className="group bg-gradient-to-br from-pink-900/30 to-pink-800/20 border border-pink-700/40 hover:border-pink-500/60 rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-pink-500/10"
            >
              <span className="text-4xl mb-3 block">🏋️‍♀️</span>
              <h3 className="text-white font-semibold mb-1 group-hover:text-pink-300 transition-colors text-sm">
                Rutinas Mujeres
              </h3>
              <p className="text-gray-500 text-xs flex items-center gap-1">
                Ver programa
                <svg className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </p>
            </Link>
          </div>
        </div>

        {/* Biblioteca de ejercicios */}
        <div className="animate-fade-in-up" style={{ animationDelay: "140ms" }}>
          <h2 className="text-base font-semibold text-gray-300 mb-3 uppercase tracking-wider text-xs">
            Acceso Rápido
          </h2>
          <Link
            href="/dashboard/exercises"
            className="group flex items-center justify-between bg-gray-800/60 border border-gray-700/40 hover:border-green-500/40 rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-green-500/8"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/15 flex items-center justify-center text-xl">
                📚
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm group-hover:text-green-400 transition-colors">
                  Biblioteca de Ejercicios
                </h3>
                <p className="text-gray-500 text-xs">Explora por grupo muscular</p>
              </div>
            </div>
            <svg className="w-4 h-4 text-gray-600 group-hover:text-green-400 transition-all duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </main>
    </div>
  );
}
