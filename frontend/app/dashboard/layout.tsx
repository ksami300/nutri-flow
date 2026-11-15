"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthService, AccessStatus } from "@/services/auth.service";
import { enforceRouteProtection } from "@/utils/auth-helpers";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [checkedPath, setCheckedPath] = useState<string | null>(null);
  const [accessStatus, setAccessStatus] = useState<AccessStatus | null>(null);
  const [accessError, setAccessError] = useState<{ path: string; message: string } | null>(null);

  useEffect(() => {
    let active = true;
    enforceRouteProtection();

    if (pathname === "/dashboard/billing") {
      Promise.resolve().then(() => {
        if (!active) return;
        setAccessError(null);
        setCheckedPath(pathname);
      });
      return () => {
        active = false;
      };
    }

    AuthService.getAccessStatus()
      .then((status) => {
        if (!active) return;
        setAccessStatus(status);
        setAccessError(null);
        setCheckedPath(pathname);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setAccessError({
          path: pathname,
          message: error instanceof Error ? error.message : "Greška pri proveri pristupa.",
        });
        setCheckedPath(pathname);
      });

    return () => {
      active = false;
    };
  }, [pathname]);

  const navItems = [
    { name: "📋 Moja Ishrana", href: "/dashboard" },
    { name: "👤 Moj Profil", href: "/dashboard/profile" },
    { name: "⚙️ Podešavanja", href: "/dashboard/settings" },
    { name: "📈 Monitoring", href: "/dashboard/metrics" },
    { name: "⭐ Premium", href: "/dashboard/billing" },
  ];

  if (checkedPath !== pathname) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-500 text-sm font-medium">
        Učitavanje bezbednosnih protokola...
      </div>
    );
  }

  if (accessError?.path === pathname) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-950 px-6 text-center text-white">
        <p>Ne možemo da proverimo pristup vašem nalogu: {accessError.message}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950"
        >
          Pokušajte ponovo
        </button>
      </main>
    );
  }

  if (!accessStatus?.hasAccess && pathname !== "/dashboard/billing") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 px-6 text-white">
        <section className="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center">
          <h1 className="text-3xl font-bold">Besplatan pristup je istekao</h1>
          <p className="mt-4 text-slate-300">
            Sedmodnevni probni period je završen. Aktivirajte Premium da biste
            nastavili da koristite planove ishrane i AI Coach.
          </p>
          {accessStatus?.trialEndsAt && (
            <p className="mt-2 text-sm text-slate-400">
              Probni period se završio{" "}
              {new Date(accessStatus.trialEndsAt).toLocaleDateString()}.
            </p>
          )}
          <Link
            href="/dashboard/billing"
            className="mt-6 inline-flex rounded-xl bg-emerald-500 px-6 py-3 font-bold text-slate-950"
          >
            Pogledajte Premium
          </Link>
        </section>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      
      {/* BOČNI SIDEBAR PANEL */}
      <aside className="fixed inset-y-0 left-0 w-64 border-r border-slate-200 bg-white p-6 shadow-sm hidden md:flex flex-col justify-between">
        <div className="space-y-8">
          <div>
            <div className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-700 bg-clip-text text-transparent">
              🥦 NutriFlow Premium
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">B2C AI Lifecycle Engine</p>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-slate-950 text-white shadow-md shadow-slate-950/20"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-slate-100 pt-4 text-center">
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Version 1.0.0 Live</p>
        </div>
      </aside>

      {/* GLAVNI KONTEJNER ZA STRANICE */}
      <main className="flex-1 md:pl-64">
        <header className="flex md:hidden items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
          <span className="font-bold text-slate-900">🥦 NutriFlow</span>
          <div className="flex gap-4 text-xs font-semibold text-slate-600">
            <Link href="/dashboard" className="hover:text-slate-950">Ishrana</Link>
            <Link href="/dashboard/profile" className="hover:text-slate-950">Profil</Link>
            <Link href="/dashboard/metrics" className="hover:text-slate-950">Status</Link>
          </div>
        </header>

        <div className="w-full">
          {children}
        </div>
      </main>

    </div>
  );
}
