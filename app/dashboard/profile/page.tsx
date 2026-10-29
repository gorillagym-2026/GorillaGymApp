import { getSession } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { UserNav } from "@/components/user/UserNav";
import { MembershipStatus } from "@/components/user/MembershipStatus";
import { MembershipHistory } from "@/components/user/MembershipHistory";
import { ChangePasswordButton } from "@/components/user/ChangePasswordButton";
import prisma from "@/lib/prisma";

export default async function UserProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "admin") redirect("/admin");

  const [profile, membership, allMemberships] = await Promise.all([
    prisma.profile.findUnique({ where: { id: session.id } }),
    prisma.membership.findFirst({
      where: { userId: session.id, status: "active" },
      orderBy: { endDate: "desc" },
    }),
    prisma.membership.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const allMembershipsForComponent = allMemberships.map((m) => ({
    ...m,
    plan_type: m.planType,
    start_date: m.startDate.toISOString(),
    end_date: m.endDate.toISOString(),
    created_at: m.createdAt.toISOString(),
    payment_method: m.paymentMethod ?? undefined,
    user_id: m.userId,
  }));

  const firstName = (profile?.fullName || session.name || "").split(" ")[0];
  const initials = (profile?.fullName || session.name || "U")
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-gray-900">
      <UserNav userName={profile?.fullName || session.name || "Usuario"} />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

        {/* Page header */}
        <div className="flex items-center justify-between mb-6 animate-fade-in-up">
          <div>
            <h1 className="text-xl font-bold text-white">Mi Perfil</h1>
            <p className="text-gray-500 text-sm mt-0.5">Información personal y membresía</p>
          </div>
          <ChangePasswordButton />
        </div>

        {/* Profile card */}
        <div className="bg-gray-800/80 border border-gray-700/60 rounded-xl p-5 mb-4 animate-fade-in-up" style={{ animationDelay: "60ms" }}>
          {/* Avatar + name row */}
          <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-700/40">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-black text-lg font-bold flex-shrink-0 shadow-lg shadow-green-900/30">
              {initials}
            </div>
            <div>
              <h2 className="text-white font-semibold text-base leading-none mb-1">
                {profile?.fullName || session.name}
              </h2>
              <p className="text-gray-500 text-xs">Socio activo</p>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-gray-900/40 border border-gray-700/30 rounded-lg p-3">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Nombre</p>
              <p className="text-white font-medium text-sm">{profile?.fullName || "—"}</p>
            </div>
            <div className="bg-gray-900/40 border border-gray-700/30 rounded-lg p-3">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">DNI</p>
              <p className="text-white font-medium text-sm font-mono">{profile?.dni || "—"}</p>
            </div>
            <div className="bg-gray-900/40 border border-gray-700/30 rounded-lg p-3">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Teléfono</p>
              <p className="text-white font-medium text-sm">{profile?.phone || "No especificado"}</p>
            </div>
            <div className="bg-gray-900/40 border border-gray-700/30 rounded-lg p-3">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Miembro desde</p>
              <p className="text-white font-medium text-sm">
                {profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Membership status */}
        <div className="mb-4 animate-fade-in-up" style={{ animationDelay: "120ms" }}>
          <MembershipStatus
            membership={
              membership
                ? {
                    ...membership,
                    plan_type: membership.planType,
                    start_date: membership.startDate.toISOString(),
                    end_date: membership.endDate.toISOString(),
                    status: membership.status,
                  }
                : null
            }
          />
        </div>

        {/* Membership history */}
        <div className="animate-fade-in-up" style={{ animationDelay: "180ms" }}>
          <MembershipHistory memberships={allMembershipsForComponent} />
        </div>
      </main>
    </div>
  );
}
