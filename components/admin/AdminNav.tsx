"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { InstallAppButton } from "@/components/InstallAppButton";

interface AdminNavProps {
  userName: string;
}

// Íconos de línea (estilo uniforme, 24x24, stroke)
const ICONS: Record<string, string[]> = {
  dashboard: ["M3 13h8V3H3v10zM13 21h8V11h-8v10zM3 21h8v-6H3v6zM13 3v6h8V3h-8z"],
  members: [
    "M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2",
    "M9 11a4 4 0 100-8 4 4 0 000 8z",
    "M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
  ],
  money: [
    "M2 7a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V7z",
    "M12 15a3 3 0 100-6 3 3 0 000 6zM6 9v.01M18 15v.01",
  ],
  exercises: ["M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11"],
  routines: [
    "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2",
    "M9 5a2 2 0 002 2h2a2 2 0 002-2 2 2 0 00-2-2h-2a2 2 0 00-2 2zM9 12h6M9 16h4",
  ],
  admins: ["M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z", "M9 12l2 2 4-4"],
  settings: [
    "M10.3 4.3c.4-1.7 2.9-1.7 3.4 0a1.7 1.7 0 002.6 1.1c1.5-.9 3.3.8 2.4 2.4a1.7 1.7 0 001 2.5c1.8.4 1.8 2.9 0 3.4a1.7 1.7 0 00-1 2.6c.9 1.5-.9 3.3-2.4 2.4a1.7 1.7 0 00-2.6 1c-.4 1.8-2.9 1.8-3.4 0a1.7 1.7 0 00-2.5-1c-1.6.9-3.3-.9-2.4-2.4a1.7 1.7 0 00-1.1-2.6c-1.7-.4-1.7-2.9 0-3.4a1.7 1.7 0 001.1-2.5c-.9-1.6.8-3.3 2.4-2.4a1.7 1.7 0 002.5-1.1z",
    "M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  ],
  logout: ["M17 16l4-4m0 0l-4-4m4 4H7M13 16v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"],
  chevron: ["M19 9l-7 7-7-7"],
};

function Icon({ name, className = "w-[18px] h-[18px]" }: { name: string; className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
      {ICONS[name].map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}

const navItems = [
  { href: "/admin",             label: "Dashboard",     icon: "dashboard" },
  { href: "/admin/members",     label: "Alumnos",       icon: "members" },
  { href: "/admin/recaudacion", label: "Recaudación",   icon: "money" },
  { href: "/admin/exercises",   label: "Ejercicios",    icon: "exercises" },
  { href: "/admin/routines",    label: "Rutinas",       icon: "routines" },
  { href: "/admin/admins",      label: "Admins",        icon: "admins" },
  { href: "/admin/settings",    label: "Configuración", icon: "settings" },
];

export function AdminNav({ userName }: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);

  const initial = userName.trim().charAt(0).toUpperCase();
  const firstName = userName.trim().split(" ")[0];

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(href + "/");

  // Cerrar el menú de usuario al hacer click afuera
  useEffect(() => {
    if (!userOpen) return;
    const onClick = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [userOpen]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-800 bg-gray-900/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-6">
          {/* Logo */}
          <Link href="/admin" className="flex items-center gap-2 shrink-0 whitespace-nowrap">
            <span className="text-2xl leading-none">🦍</span>
            <span className="text-white font-bold text-lg tracking-tight">
              Gorilla <span className="text-green-400">GYM</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-0.5 flex-1 min-w-0">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={`flex items-center gap-2 px-2.5 xl:px-3 py-2 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors ${
                    active
                      ? "bg-green-500/10 text-green-400"
                      : "text-gray-400 hover:text-white hover:bg-gray-800/70"
                  }`}
                >
                  <Icon name={item.icon} className={`w-[18px] h-[18px] xl:w-[17px] xl:h-[17px] ${active ? "text-green-400" : "text-gray-500"}`} />
                  <span className={active ? "" : "hidden xl:inline"}>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Menú de usuario (desktop) */}
          <div className="hidden lg:block relative ml-auto shrink-0" ref={userRef}>
            <button
              onClick={() => setUserOpen(!userOpen)}
              className={`flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border transition-colors ${
                userOpen ? "border-gray-600 bg-gray-800" : "border-gray-800 hover:border-gray-700 hover:bg-gray-800/70"
              }`}
              aria-label="Menú de usuario"
            >
              <span className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-gray-900 text-xs font-bold">
                {initial}
              </span>
              <span className="text-gray-200 text-sm font-medium max-w-[110px] truncate">{firstName}</span>
              <Icon name="chevron" className={`w-3.5 h-3.5 text-gray-500 transition-transform ${userOpen ? "rotate-180" : ""}`} />
            </button>

            {userOpen && (
              <div className="absolute right-0 mt-2 w-60 rounded-xl border border-gray-700/80 bg-gray-900 shadow-2xl shadow-black/40 p-1.5 animate-fade-in-down">
                <div className="px-3 py-2.5 border-b border-gray-800 mb-1">
                  <p className="text-white text-sm font-medium truncate">{userName}</p>
                  <p className="text-gray-500 text-xs">Administrador</p>
                </div>
                <InstallAppButton variant="menuItem" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Icon name="logout" className="w-4 h-4" />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden ml-auto text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors"
            aria-label="Abrir menú"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden border-t border-gray-800 animate-fade-in-down">
          <div className="px-3 pt-2 pb-3 space-y-0.5">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg text-[15px] font-medium transition-colors ${
                    active ? "bg-green-500/10 text-green-400" : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <Icon name={item.icon} className={`w-5 h-5 ${active ? "text-green-400" : "text-gray-500"}`} />
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="border-t border-gray-800 px-3 py-3">
            <div className="flex items-center gap-3 px-3 pb-2">
              <span className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-gray-900 text-sm font-bold">
                {initial}
              </span>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{userName}</p>
                <p className="text-gray-500 text-xs">Administrador</p>
              </div>
            </div>
            <InstallAppButton variant="menuItem" />
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Icon name="logout" className="w-4 h-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
