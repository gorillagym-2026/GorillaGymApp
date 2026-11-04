"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { OfflineIndicator } from "./OfflineIndicator";
import { InstallAppButton } from "@/components/InstallAppButton";
import { Icon } from "@/components/ui/NavIcon";

interface UserNavProps {
  userName: string;
}

const navItems = [
  { href: "/dashboard",           label: "Inicio",     icon: "home" },
  { href: "/dashboard/exercises", label: "Ejercicios", icon: "exercises" },
  { href: "/dashboard/profile",   label: "Mi perfil",  icon: "user" },
];

export function UserNav({ userName }: UserNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);

  const initial = userName.trim().charAt(0).toUpperCase();
  const firstName = userName.trim().split(" ")[0];

  // Inicio también queda activo dentro de las rutinas
  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard" || pathname.startsWith("/dashboard/routine")
      : pathname === href || pathname.startsWith(href + "/");

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
    <>
      <nav className="sticky top-0 z-50 border-b border-gray-800 bg-gray-900/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-14 gap-6">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2 shrink-0 whitespace-nowrap">
              <span className="text-xl leading-none">🦍</span>
              <span className="font-bold text-white text-base tracking-tight">
                Gorilla <span className="text-green-400">GYM</span>
              </span>
            </Link>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-0.5 flex-1">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors ${
                      active ? "bg-green-500/10 text-green-400" : "text-gray-400 hover:text-white hover:bg-gray-800/70"
                    }`}
                  >
                    <Icon name={item.icon} className={`w-[17px] h-[17px] ${active ? "text-green-400" : "text-gray-500"}`} />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Menú de usuario (desktop) */}
            <div className="hidden md:block relative ml-auto shrink-0" ref={userRef}>
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
                    <p className="text-gray-500 text-xs">Alumno</p>
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
              className="md:hidden ml-auto text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors"
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
          <div className="md:hidden border-t border-gray-800 animate-fade-in-down">
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
                  <p className="text-gray-500 text-xs">Alumno</p>
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
      <OfflineIndicator />
    </>
  );
}
