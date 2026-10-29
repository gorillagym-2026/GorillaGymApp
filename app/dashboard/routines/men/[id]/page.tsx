import { getSession } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { UserNav } from "@/components/user/UserNav";
import Link from "next/link";
import prisma from "@/lib/prisma";

export default async function MenRoutineDaysPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "admin") redirect("/admin");

  const [profile, routine, days] = await Promise.all([
    prisma.profile.findUnique({
      where: { id: session.id },
      select: { fullName: true },
    }),
    prisma.routine.findUnique({
      where: { id },
      select: { id: true, name: true },
    }),
    prisma.routineDay.findMany({
      where: { routineId: id },
      orderBy: { dayNumber: "asc" },
      include: { exercises: { select: { id: true } } },
    }),
  ]);

  if (!routine) redirect("/dashboard/routines/men");

  return (
    <div className="min-h-screen bg-gray-900">
      <UserNav userName={profile?.fullName || session.name || "Usuario"} />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-6 animate-fade-in-up">
          <Link
            href="/dashboard/routines/men"
            className="inline-flex items-center gap-1.5 text-gray-500 hover:text-blue-400 text-sm mb-4 transition-colors duration-150 group"
          >
            <svg className="w-3.5 h-3.5 transition-transform duration-150 group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver a rutinas
          </Link>
          <h1 className="text-xl font-bold text-white mb-1">{routine.name}</h1>
          <p className="text-gray-500 text-sm">
            {days.length} día{days.length !== 1 ? "s" : ""} de entrenamiento
          </p>
        </div>

        {days.length > 0 ? (
          <div className="space-y-3">
            {days.map((day, i) => (
              <Link
                key={day.id}
                href={`/dashboard/routines/men/${id}/day/${day.dayNumber}`}
                className="group flex items-center gap-4 bg-gray-800/80 border border-gray-700/60 hover:border-blue-500/40 rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-900/20 animate-fade-in-up"
                style={{ animationDelay: `${i * 50 + 60}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-blue-900/30 border border-blue-700/30 flex flex-col items-center justify-center flex-shrink-0 group-hover:border-blue-500/50 transition-colors">
                  <span className="text-blue-400 text-xs font-bold uppercase tracking-wider leading-none">Día</span>
                  <span className="text-white font-bold text-lg leading-none">{day.dayNumber}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-white font-semibold text-sm group-hover:text-blue-400 transition-colors truncate">
                    {day.dayName}
                  </h3>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {day.exercises.length} ejercicio{day.exercises.length !== 1 ? "s" : ""}
                    {day.description ? ` · ${day.description}` : ""}
                  </p>
                </div>
                <svg className="w-4 h-4 text-gray-600 flex-shrink-0 transition-all duration-150 group-hover:text-blue-400 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-gray-800/80 border border-gray-700/60 rounded-xl p-8 text-center animate-fade-in">
            <p className="text-gray-400 text-sm">No hay días configurados para esta rutina</p>
          </div>
        )}
      </main>
    </div>
  );
}
