import { getSession } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { UserNav } from "@/components/user/UserNav";
import { MembershipHistory } from "@/components/user/MembershipHistory";
import { ChangePasswordButton } from "@/components/user/ChangePasswordButton";
import prisma from "@/lib/prisma";
import { fmtDateOnly, getMembershipState, money, PLAN_LABELS, STATE_STYLES, todayAR } from "@/lib/membership";

export default async function UserProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "admin") redirect("/admin");

  const [profile, allMemberships, prices] = await Promise.all([
    prisma.profile.findUnique({ where: { id: session.id } }),
    prisma.membership.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.membershipPrice.findMany(),
  ]);

  // La membresía vigente es la de vencimiento más lejano
  const membership = [...allMemberships].sort((a, b) => b.endDate.getTime() - a.endDate.getTime())[0] ?? null;
  const state = getMembershipState(membership?.endDate, membership?.status);
  const st = STATE_STYLES[state.key];
  const priceMap = Object.fromEntries(prices.map((p) => [p.planType, p.price]));
  const today = todayAR().getTime();

  const historyItems = allMemberships.map((m) => ({
    id: m.id,
    planType: m.planType,
    startDate: m.startDate.toISOString(),
    endDate: m.endDate.toISOString(),
    createdAt: m.createdAt.toISOString(),
    paymentMethod: m.paymentMethod,
    // Monto real cobrado; si es un pago viejo sin monto, el precio actual del plan como referencia
    amount: m.amountPaid ?? priceMap[m.planType] ?? null,
    isCurrent: m.id === membership?.id,
    isExpired: m.endDate.getTime() < today,
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
              <p className={`text-xs flex items-center gap-1.5 ${st.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                {state.key === "none" ? "Sin membresía" : state.isOverdue ? "Membresía vencida" : "Socio activo"}
              </p>
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

        {/* Membresía */}
        <div className={`mb-4 ${st.bg} border ${st.border} rounded-xl overflow-hidden animate-fade-in-up`} style={{ animationDelay: "120ms" }}>
          <div className={`h-1 ${st.bar} opacity-70`} />
          <div className="p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-white font-semibold">Membresía</h2>
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${st.text}`}>
                <span className={`w-2 h-2 rounded-full ${st.dot}`} />
                {state.label}
              </span>
            </div>
            {membership ? (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-900/40 border border-gray-700/30 rounded-lg p-3">
                    <p className="text-gray-500 text-[11px] uppercase tracking-wider mb-1">Plan</p>
                    <p className="text-white font-medium text-sm">{PLAN_LABELS[membership.planType] ?? membership.planType}</p>
                  </div>
                  <div className="bg-gray-900/40 border border-gray-700/30 rounded-lg p-3">
                    <p className="text-gray-500 text-[11px] uppercase tracking-wider mb-1">Inicio</p>
                    <p className="text-white font-medium text-sm">{fmtDateOnly(membership.startDate, { day: "2-digit", month: "2-digit", year: "2-digit" })}</p>
                  </div>
                  <div className="bg-gray-900/40 border border-gray-700/30 rounded-lg p-3">
                    <p className="text-gray-500 text-[11px] uppercase tracking-wider mb-1">Vence</p>
                    <p className={`font-medium text-sm ${state.key === "active" ? "text-white" : st.text}`}>
                      {fmtDateOnly(membership.endDate, { day: "2-digit", month: "2-digit", year: "2-digit" })}
                    </p>
                  </div>
                </div>
                <p className={`text-sm mt-3 ${state.key === "active" ? "text-gray-400" : st.text}`}>
                  {state.detail}
                  {state.isOverdue ? " · Acercate al gym para renovar" : ""}
                </p>
                {membership.amountPaid != null && (
                  <p className="text-gray-500 text-xs mt-1">Último pago: {money(membership.amountPaid)}</p>
                )}
              </>
            ) : (
              <p className="text-gray-400 text-sm">{state.detail}</p>
            )}
          </div>
        </div>

        {/* Historial */}
        <div className="animate-fade-in-up" style={{ animationDelay: "180ms" }}>
          <MembershipHistory items={historyItems} />
        </div>
      </main>
    </div>
  );
}
