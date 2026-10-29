import { getSession } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { UserNav } from "@/components/user/UserNav";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { UserExercisesLibrary } from "@/components/user/UserExercisesLibrary";

export default async function ExercisesLibraryPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "admin") redirect("/admin");

  const [profile, exercises] = await Promise.all([
    prisma.profile.findUnique({
      where: { id: session.id },
      select: { fullName: true },
    }),
    prisma.exercise.findMany({
      orderBy: { name: "asc" },
      include: {
        images: { orderBy: { orderIndex: "asc" } },
      },
    }),
  ]);

  const muscleGroups = [...new Set(exercises.map((e) => e.muscleGroup))].sort();

  const exercisesForComponent = exercises.map((e) => ({
    id: e.id,
    name: e.name,
    muscle_group: e.muscleGroup,
    image_url: e.imageUrl ?? undefined,
    description: e.description ?? undefined,
    instructions: e.instructions ?? undefined,
    exercise_images: e.images.map((img) => ({
      id: img.id,
      image_url: img.imageUrl,
      order_index: img.orderIndex,
    })),
  }));

  return (
    <div className="min-h-screen bg-gray-900">
      <UserNav userName={profile?.fullName || session.name || "Usuario"} />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-6 animate-fade-in-up">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-gray-500 hover:text-green-400 text-sm mb-4 transition-colors duration-150 group"
          >
            <svg className="w-3.5 h-3.5 transition-transform duration-150 group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver al inicio
          </Link>
          <h1 className="text-xl font-bold text-white mb-1">
            Biblioteca de Ejercicios
          </h1>
          <p className="text-gray-500 text-sm">
            {exercises.length} ejercicios · {muscleGroups.length} grupos musculares
          </p>
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: "60ms" }}>
          <UserExercisesLibrary
            exercises={exercisesForComponent}
            muscleGroups={muscleGroups}
          />
        </div>
      </main>
    </div>
  );
}
