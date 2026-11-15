"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthService } from "@/services/auth.service";

export default function Navbar() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("token") || localStorage.getItem("accessToken")
        : null;
    setIsLoggedIn(Boolean(token) || Boolean(pathname?.startsWith("/dashboard")));
  }, [pathname]);

  const isAuthPage = pathname === "/login" || pathname === "/register";

  return (
    <nav className="w-full bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link
              href={isLoggedIn ? "/dashboard" : "/"}
              className="text-xl font-black tracking-tight text-emerald-400"
            >
              NutriFlow
            </Link>

            {isLoggedIn && !isAuthPage && (
              <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
                <Link href="/dashboard" className="hover:text-emerald-400 transition-colors">
                  Glavna
                </Link>
                <Link href="/dashboard/coach" className="hover:text-emerald-400 transition-colors">
                  AI Coach
                </Link>
                <Link href="/dashboard/settings" className="hover:text-emerald-400 transition-colors">
                  Podešavanja
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {isLoggedIn && !isAuthPage ? (
              <button
                onClick={() => AuthService.logout()}
                className="py-2 px-4 rounded-xl border border-slate-700 bg-slate-950 text-sm font-semibold hover:bg-slate-800 transition-all"
              >
                Odjavi se
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="py-2 px-4 rounded-xl border border-slate-700 bg-slate-950 text-sm font-semibold text-white hover:bg-slate-800 transition-all"
                >
                  Prijavi se
                </Link>
                <Link
                  href="/register"
                  className="py-2 px-4 rounded-xl bg-emerald-500 text-slate-950 text-sm font-bold hover:bg-emerald-400 transition-all"
                >
                  Registruj se
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
