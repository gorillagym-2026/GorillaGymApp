"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { InstallAppButton } from "@/components/InstallAppButton";

interface AdminNavProps {
  userName: string;
}

export function AdminNav({ userName }: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const navItems = [
    { href: "/admin",           label: "Dashboard",   icon: "📊" },
    { href: "/admin/members",   label: "Alumnos",     icon: "👥" },
    { href: "/admin/exercises", label: "Ejercicios",  icon: "🏋️" },
    { href: "/admin/routines",  label: "Rutinas",     icon: "📋" },
    { href: "/admin/admins",    label: "Admins",      icon: "👑" },
    { href: "/admin/settings",  label: "Configuracion", icon: "⚙️" },
  ];

  return (
    <nav className="bg-gray-900 border-b border-gray-700/60 sticky top-0 z-50 backdrop-blur-sm bg-gray-900/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/admin" className="flex items-center space-x-2 group">
            <span className="text-2xl transition-transform duration-200 group-hover:scale-110">🦍</span>
            <span className="text-white font-bold text-lg tracking-tight">
              Gorilla <span className="text-green-400">GYM</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-baseline space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                    isActive
                      ? "bg-green-500/15 text-green-400 shadow-sm"
                      : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <span className="text-base leading-none">{item.icon}</span>
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-green-400 rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center space-x-3">
            <InstallAppButton />
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700">
              <span className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-black text-xs font-bold flex-shrink-0">
                {userName.charAt(0).toUpperCase()}
              </span>
              <span className="text-gray-200 text-sm">{userName}</span>
            </div>
            <button
              onClick={handleLogout}
              className="bg-gray-800 hover:bg-red-600/20 border border-gray-700 hover:border-red-500/50 text-gray-300 hover:text-red-400 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
            >
              Salir
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors focus:outline-none"
            aria-label="Abrir menu"
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
        <div className="md:hidden border-t border-gray-700/60 animate-fade-in-down">
          <div className="px-3 pt-2 pb-3 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center px-3 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-green-500/15 text-green-400 border border-green-500/20"
                      : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <span className="mr-3 text-xl">{item.icon}</span>
                  {item.label}
                  {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400" />}
                </Link>
              );
            })}
          </div>
          <div className="border-t border-gray-700/60 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-black text-xs font-bold">
                {userName.charAt(0).toUpperCase()}
              </span>
              <span className="text-gray-300 text-sm">{userName}</span>
            </div>
            <div className="flex items-center space-x-2">
              <InstallAppButton />
              <button
                onClick={handleLogout}
                className="bg-red-600/20 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-red-600/30"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
