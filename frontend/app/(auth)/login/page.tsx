"use client";

import { useEffect, useState } from "react";
import { AuthService } from "@/services/auth.service";

export default function LoginPage() {
  const [loading, setLoading] = useState<boolean>(false);
  const [wakingServer, setWakingServer] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  useEffect(() => {
    const api = process.env.NEXT_PUBLIC_API_URL || "";
    if (api) fetch(`${api}/api/health`).catch(() => {});
    try {
      const params = new URLSearchParams(window.location.search);
      const fromQuery = params.get("email");
      const saved = localStorage.getItem("nf_last_email");
      if (fromQuery) setEmail(fromQuery);
      else if (saved) setEmail(saved);
    } catch {}
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setWakingServer(false);
    const wakeTimer = setTimeout(() => setWakingServer(true), 3000);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      clearTimeout(wakeTimer);
      alert("❌ Sva polja su obavezna.");
      setLoading(false);
      return;
    }

    try { localStorage.setItem("nf_last_email", cleanEmail); } catch {}

    const result = await AuthService.login(cleanEmail, password);
    clearTimeout(wakeTimer);
    if (result.success) {
      window.location.href = "/dashboard";
    } else {
      alert(`❌ Greška: ${result.message}`);
      setLoading(false);
      setWakingServer(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 text-white">
      <div className="w-full max-w-md p-8 bg-slate-900 border border-slate-800 rounded-3xl space-y-6 shadow-xl">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight">Dobrodošli nazad</h2>
          <p className="text-slate-400 text-sm mt-2">Prijavite se na NutriFlow SaaS platformu</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1">E-mail adresa</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ime@domen.com" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors" />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Lozinka</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 text-slate-950 font-bold rounded-xl transition-all">
            {loading ? "Autorizacija u toku..." : "Prijavi se"}
          </button>
          {wakingServer && <p className="text-xs text-amber-300 text-center bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5">⏳ Budimo cloud server (prvo pokretanje posle pauze traje ~30 sekundi)...</p>}
        </form>
        <div className="text-center text-sm text-slate-400">Nemate nalog? <a href="/register" className="text-emerald-400 hover:underline">Registrujte se</a></div>
      </div>
    </div>
  );
}
