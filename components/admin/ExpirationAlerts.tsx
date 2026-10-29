import prisma from "@/lib/prisma";
import Link from "next/link";

export async function ExpirationAlerts() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const threeDaysFromNow = new Date(today);
  threeDaysFromNow.setDate(today.getDate() + 3);

  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(today.getDate() + 7);

  const [expired, criticalExpiring, warningExpiring] = await Promise.all([
    prisma.membership.findMany({
      where: { status: "active", endDate: { lt: today } },
      include: { user: { select: { id: true, fullName: true, dni: true } } },
      orderBy: { endDate: "desc" },
    }),
    prisma.membership.findMany({
      where: { status: "active", endDate: { gte: today, lte: threeDaysFromNow } },
      include: { user: { select: { id: true, fullName: true, dni: true } } },
      orderBy: { endDate: "asc" },
    }),
    prisma.membership.findMany({
      where: { status: "active", endDate: { gt: threeDaysFromNow, lte: sevenDaysFromNow } },
      include: { user: { select: { id: true, fullName: true, dni: true } } },
      orderBy: { endDate: "asc" },
    }),
  ]);

  const getDaysUntilExpiration = (endDate: Date) => {
    const diffTime = endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const totalAlerts = expired.length + criticalExpiring.length + warningExpiring.length;
  if (totalAlerts === 0) return null;

  const AlertRow = ({
    name,
    dni,
    label,
    href,
    accentClass,
    dotClass,
  }: {
    name: string;
    dni: string;
    label: string;
    href: string;
    accentClass: string;
    dotClass: string;
  }) => (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-white/5 transition-all duration-150 border border-transparent hover:border-white/10"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotClass}`} />
        <div className="min-w-0">
          <p className="text-white text-sm font-medium truncate">{name}</p>
          <p className={`text-xs truncate ${accentClass}`}>
            DNI {dni} · {label}
          </p>
        </div>
      </div>
      <svg
        className={`w-3.5 h-3.5 flex-shrink-0 ml-2 transition-transform duration-150 group-hover:translate-x-0.5 ${accentClass}`}
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );

  return (
    <div className="space-y-3">
      {/* Vencidas */}
      {expired.length > 0 && (
        <div className="bg-red-500/8 border border-red-500/25 rounded-xl p-4 animate-fade-in-up">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-base leading-none">🚨</span>
            </div>
            <div>
              <h3 className="text-red-400 font-semibold text-sm">Membresías Vencidas</h3>
              <p className="text-red-300/70 text-xs">
                {expired.length} alumno{expired.length !== 1 ? "s" : ""}
              </p>
            </div>
            <span className="ml-auto text-xs font-bold bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
              {expired.length}
            </span>
          </div>
          <div className="space-y-0.5 max-h-52 overflow-y-auto pr-0.5">
            {expired.map((m) => {
              const daysAgo = Math.abs(getDaysUntilExpiration(m.endDate));
              return (
                <AlertRow
                  key={m.id}
                  href={`/admin/members/${m.user.id}`}
                  name={m.user.fullName}
                  dni={m.user.dni}
                  label={`Venció hace ${daysAgo} día${daysAgo !== 1 ? "s" : ""}`}
                  accentClass="text-red-400/70"
                  dotClass="bg-red-500"
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Críticas 0-3 días */}
      {criticalExpiring.length > 0 && (
        <div className="bg-orange-500/8 border border-orange-500/25 rounded-xl p-4 animate-fade-in-up" style={{ animationDelay: "60ms" }}>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-base leading-none">⚠️</span>
            </div>
            <div>
              <h3 className="text-orange-400 font-semibold text-sm">Vencen en ≤3 días</h3>
              <p className="text-orange-300/70 text-xs">
                {criticalExpiring.length} membresía{criticalExpiring.length !== 1 ? "s" : ""}
              </p>
            </div>
            <span className="ml-auto text-xs font-bold bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">
              {criticalExpiring.length}
            </span>
          </div>
          <div className="space-y-0.5 max-h-52 overflow-y-auto pr-0.5">
            {criticalExpiring.map((m) => {
              const days = getDaysUntilExpiration(m.endDate);
              return (
                <AlertRow
                  key={m.id}
                  href={`/admin/members/${m.user.id}`}
                  name={m.user.fullName}
                  dni={m.user.dni}
                  label={days === 0 ? "Vence HOY" : `Vence en ${days} día${days !== 1 ? "s" : ""}`}
                  accentClass="text-orange-400/70"
                  dotClass="bg-orange-500"
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Advertencia 4-7 días */}
      {warningExpiring.length > 0 && (
        <div className="bg-yellow-500/8 border border-yellow-500/25 rounded-xl p-4 animate-fade-in-up" style={{ animationDelay: "120ms" }}>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-base leading-none">⏰</span>
            </div>
            <div>
              <h3 className="text-yellow-400 font-semibold text-sm">Vencen en 4-7 días</h3>
              <p className="text-yellow-300/70 text-xs">
                {warningExpiring.length} membresía{warningExpiring.length !== 1 ? "s" : ""}
              </p>
            </div>
            <span className="ml-auto text-xs font-bold bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
              {warningExpiring.length}
            </span>
          </div>
          <div className="space-y-0.5 max-h-52 overflow-y-auto pr-0.5">
            {warningExpiring.map((m) => {
              const days = getDaysUntilExpiration(m.endDate);
              return (
                <AlertRow
                  key={m.id}
                  href={`/admin/members/${m.user.id}`}
                  name={m.user.fullName}
                  dni={m.user.dni}
                  label={`Vence en ${days} días`}
                  accentClass="text-yellow-400/70"
                  dotClass="bg-yellow-500"
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
