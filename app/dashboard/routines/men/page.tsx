import { getSession } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { UserNav } from "@/components/user/UserNav";
import Link from "next/link";
import prisma from "@/lib/prisma";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function MenRoutinesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "admin") redirect("/admin");

  const [profile, routines] = await Promise.all([
    prisma.profile.findUnique({
      where: { id: session.id },
      select: { fullName: true },
    }),
    prisma.routine.findMany({
      where: { category: { equals: "Hombres", mode: "insensitive" } },
      select: { id: true, name: true, description: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="min-h-screen bg-gray-900">
      <UserNav userName={profile?.fullName || session.name || "Usuario"} />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-6 animate-fade-in-up">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-gray-500 hover:text-blue-400 text-sm mb-4 transition-colors duration-150 group"
          >
            <svg className="w-3.5 h-3.5 transition-transform duration-150 group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver al inicio
          </Link>
          <h1 className="text-xl font-bold text-white mb-1">Rutinas Hombres</h1>
          <p className="text-gray-500 text-sm">
            {routines.length} rutina{routines.length !== 1 ? "s" : ""} disponible{routines.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Routine cards */}
        <div className="space-y-3">
          {routines.length > 0 ? (
            routines.map((routine, i) => (
              <Link
                key={routine.id}
                href={`/dashboard/routines/men/${routine.id}`}
                className="group flex items-center gap-4 bg-gray-800/80 border border-gray-700/60 hover:border-blue-500/40 rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-900/20 animate-fade-in-up"
                style={{ animationDelay: `${i * 50 + 60}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-900/40 to-blue-800/20 border border-blue-700/30 flex items-center justify-center flex-shrink-0 group-hover:border-blue-500/50 transition-colors">
                  <span className="text-2xl">🏋️</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-white font-semibold text-sm group-hover:text-blue-400 transition-colors truncate">
                    {routine.name}
                  </h3>
                  {routine.description && (
                    <p className="text-gray-500 text-xs mt-0.5 truncate">{routine.description}</p>
                  )}
                </div>
                <svg className="w-4 h-4 text-gray-600 flex-shrink-0 transition-all duration-150 group-hover:text-blue-400 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))
          ) : (
            <div className="bg-gray-800/80 border border-gray-700/60 rounded-xl p-8 text-center animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-gray-700/50 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-400 text-sm">No hay rutinas disponibles</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
