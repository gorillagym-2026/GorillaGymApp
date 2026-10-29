"use client";

import { useState } from "react";
import Link from "next/link";

interface Membership {
  plan_type: string;
  status: string;
  end_date: string;
}

interface Member {
  id: string;
  full_name: string;
  dni?: string;
  phone?: string;
  created_at: string;
  memberships: Membership[];
}

interface MembersListProps {
  members: Member[];
}

export function MembersList({ members }: MembersListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired">("all");

  const getVencimientoInfo = (membership: Membership) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const vencimiento = new Date(membership.end_date);
    vencimiento.setHours(0, 0, 0, 0);
    const diasRestantes = Math.ceil(
      (vencimiento.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    const estaVencido = membership.status === "expired" || diasRestantes < 0;

    if (estaVencido) {
      return { texto: diasRestantes < 0 ? `Hace ${Math.abs(diasRestantes)}d` : "Vencido", color: "text-red-400",    dot: "bg-red-500",    isActive: false };
    } else if (diasRestantes === 0) {
      return { texto: "Vence HOY",                  color: "text-orange-400", dot: "bg-orange-500", isActive: true  };
    } else if (diasRestantes <= 3) {
      return { texto: `${diasRestantes}d`,          color: "text-orange-400", dot: "bg-orange-500", isActive: true  };
    } else {
      return { texto: `${diasRestantes}d`,          color: "text-green-400",  dot: "bg-green-500",  isActive: true  };
    }
  };

  const planLabels: Record<string, string> = {
    quincenal: "Quincenal",
    mensual:   "Mensual",
    diario:    "Día",
    semanal:   "Semanal",
  };

  const searchFiltered = members.filter((member) => {
    const search = searchTerm.toLowerCase();
    return (
      (member.full_name ?? "").toLowerCase().includes(search) ||
      member.dni?.toLowerCase().includes(search)
    );
  });

  const filteredMembers = searchFiltered.filter((member) => {
    if (statusFilter === "all") return true;
    const membership = member.memberships[0];
    if (!membership) return statusFilter === "expired";
    const info = getVencimientoInfo(membership);
    return statusFilter === "active" ? info.isActive : !info.isActive;
  });

  const activeCount  = members.filter((m) => m.memberships[0] && getVencimientoInfo(m.memberships[0]).isActive).length;
  const expiredCount = members.length - activeCount;

  return (
    <div className="bg-gray-800/80 border border-gray-700/60 rounded-xl overflow-hidden">
      {/* Filters */}
      <div className="p-4 border-b border-gray-700/60 space-y-3">
        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre o DNI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-900/60 border border-gray-600/40 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-200"
          />
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-2">
          {[
            { key: "all",     label: "Todos",    count: members.length,  activeCls: "bg-blue-500/20 text-blue-300 border-blue-500/30"  },
            { key: "active",  label: "Activos",  count: activeCount,     activeCls: "bg-green-500/20 text-green-300 border-green-500/30" },
            { key: "expired", label: "Vencidos", count: expiredCount,    activeCls: "bg-red-500/20 text-red-300 border-red-500/30"     },
          ].map(({ key, label, count, activeCls }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key as typeof statusFilter)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                statusFilter === key
                  ? activeCls
                  : "bg-gray-700/50 text-gray-400 border-gray-600/40 hover:bg-gray-700 hover:text-gray-300"
              }`}
            >
              {label}
              <span className="font-bold opacity-80">{count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-900/40 border-b border-gray-700/40">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alumno</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Contacto</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimiento</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/40">
            {filteredMembers.map((member) => {
              const membership = member.memberships[0];
              const info       = membership ? getVencimientoInfo(membership) : null;

              return (
                <tr key={member.id} className="hover:bg-gray-700/30 transition-colors duration-150 group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {(member.full_name ?? "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{member.full_name}</p>
                        <p className="text-gray-500 text-xs">DNI {member.dni || "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <p className="text-gray-400 text-sm">{member.phone || "—"}</p>
                  </td>
                  <td className="px-4 py-3">
                    {membership ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/20">
                        {planLabels[membership.plan_type] || membership.plan_type}
                      </span>
                    ) : (
                      <span className="text-gray-600 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {membership && info ? (
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${info.dot}`} />
                        <div>
                          <p className="text-gray-300 text-xs">
                            {new Date(membership.end_date).toLocaleDateString("es-AR")}
                          </p>
                          <p className={`text-xs ${info.color}`}>{info.texto}</p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-600 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/members/${member.id}`}
                      className="inline-flex items-center gap-1 text-green-400 hover:text-green-300 text-sm font-medium transition-colors group/link"
                    >
                      Ver
                      <svg className="w-3.5 h-3.5 transition-transform duration-150 group-hover/link:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredMembers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">
              {searchTerm
                ? "No se encontraron alumnos"
                : statusFilter === "active"
                  ? "No hay alumnos activos"
                  : statusFilter === "expired"
                    ? "No hay alumnos vencidos"
                    : "No hay alumnos registrados"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
