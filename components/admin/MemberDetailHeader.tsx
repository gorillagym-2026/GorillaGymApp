"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ResetPasswordButton } from "@/components/admin/ResetPasswordButton";

interface Member {
  id: string;
  full_name: string;
  dni?: string;
  phone?: string;
  email?: string;
  created_at: string;
}

export function MemberDetailHeader({ member }: { member: Member }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: member.full_name,
    dni: member.dni || "",
    phone: member.phone || "",
  });

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/members/${member.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setIsEditing(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ full_name: member.full_name, dni: member.dni || "", phone: member.phone || "" });
    setIsEditing(false);
    setError(null);
  };

  const initial = (member.full_name ?? "?").charAt(0).toUpperCase();

  return (
    <>
      <div className="bg-gray-800/80 border border-gray-700/60 rounded-xl p-6 animate-fade-in-up">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-white text-xl font-bold">{initial}</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{member.full_name}</h1>
              <p className="text-gray-500 text-xs mt-0.5">
                Miembro desde{" "}
                {new Date(member.created_at).toLocaleDateString("es-AR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700/60 hover:bg-gray-700 border border-gray-600/50 hover:border-gray-500 text-gray-300 hover:text-white rounded-lg text-sm transition-all duration-200"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {isEditing ? (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: "Nombre Completo", key: "full_name", type: "text" },
                { label: "DNI", key: "dni", type: "text" },
                { label: "Teléfono", key: "phone", type: "tel" },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                    {label}
                  </label>
                  <input
                    type={type}
                    value={formData[key as keyof typeof formData]}
                    onChange={(e) =>
                      setFormData({ ...formData, [key]: key === "dni" ? e.target.value.replace(/\D/g, "") : e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-900/60 border border-gray-600/40 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-200"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancel}
                disabled={loading}
                className="px-4 py-2 border border-gray-600/50 text-gray-400 hover:text-gray-300 rounded-lg hover:bg-gray-700/50 transition-all duration-200 disabled:opacity-50 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-all duration-200 disabled:opacity-50 text-sm font-medium"
              >
                {loading ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "DNI", value: member.dni || "No especificado" },
              { label: "Teléfono", value: member.phone || "No especificado" },
              { label: "ID", value: `${member.id.substring(0, 8)}…` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-900/40 rounded-lg p-3 border border-gray-700/30">
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">{label}</p>
                <p className="text-white text-sm font-medium">{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4">
        <ResetPasswordButton
          userId={member.id}
          userEmail={member.email || ""}
          userName={member.full_name}
        />
      </div>
    </>
  );
}
