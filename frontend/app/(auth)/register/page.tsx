"use client";

import { useEffect, useState } from "react";
import { AuthService } from "@/services/auth.service";

export default function RegisterPage() {
  const [loading, setLoading] = useState<boolean>(false);
  const [wakingServer, setWakingServer] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [marketingConsent, setMarketingConsent] = useState<boolean>(false);

  useEffect(() => {
    const api = process.env.NEXT_PUBLIC_API_URL || "";
    if (api) fetch(`${api}/api/health`).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setWakingServer(false);
    const wakeTimer = setTimeout(() => setWakingServer(true), 3000);

    const cleanEmail = email.trim().toLowerCase();
    if (!name.trim() || !cleanEmail || !password) {
      clearTimeout(wakeTimer);
      alert("❌ Sva polja su obavezna za registraciju naloga.");
      setLoading(false);
      return;
    }

    try { localStorage.setItem("nf_last_email", cleanEmail); } catch {}

    const result = await AuthService.register(name.trim(), cleanEmail, password, marketingConsent);
    if (result.success) {
      const loginRes = await AuthService.login(cleanEmail, password);
      clearTimeout(wakeTimer);
      if (loginRes.success) {
        window.location.href = "/dashboard";
        return;
      }
      window.location.href = `/login?email=${encodeURIComponent(cleanEmail)}`;
    } else {
      clearTimeout(wakeTimer);
      alert(`❌ Greška: ${result.message}`);
      setLoading(false);
      setWakingServer(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 text-white">
      <div className="w-full max-w-md p-8 bg-slate-900 border border-slate-800 rounded-3xl space-y-6 shadow-xl">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight">Kreirajte nalog</h2>
          <p className="text-slate-400 text-sm mt-2">Pokrenite svoj lični NutriFlow nalog</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Korisničko ime / Ime</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nemanja Mihajlović" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors" />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">E-mail adresa</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ime@domen.com" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors" />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Sigurna Lozinka (min. 8 karaktera, veliko slovo i broj)</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors" />
          </div>
          <label className="flex items-start gap-3 text-sm text-slate-300">
            <input type="checkbox" checked={marketingConsent} onChange={(event) => setMarketingConsent(event.target.checked)} className="mt-1 accent-emerald-500" />
            <span>Želim da primam povremene NutriFlow poruke o probnom periodu i Premium opcijama. Saglasnost je dobrovoljna i mogu da je povučem preko linka za odjavu u svakoj poruci.</span>
          </label>
          <button type="submit" disabled={loading} className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 text-slate-950 font-bold rounded-xl transition-all">
            {loading ? "Kreiranje naloga i prijava..." : "Registruj se"}
          </button>
          {wakingServer && <p className="text-xs text-amber-300 text-center bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5">⏳ Budimo cloud server (prvo pokretanje posle pauze traje ~30 sekundi)...</p>}
        </form>
        <div className="text-center text-sm text-slate-400">Već imate nalog? <a href="/login" className="text-emerald-400 hover:underline">Prijavite se</a></div>
      </div>
    </div>
  );
}
