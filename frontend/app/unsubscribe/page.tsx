"use client";

import { useState } from "react";
import { API_BASE_URL } from "@/lib/api-config";

export default function UnsubscribePage() {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const unsubscribe = async () => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setMessage("Link za odjavu nedostaje ili nije ispravan.");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/unsubscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const result = await response.json();
      if (!response.ok || result.data?.unsubscribed !== true) {
        throw new Error(result.error || "Odjava nije uspela.");
      }
      setMessage("Uspešno ste odjavljeni sa promotivnih NutriFlow poruka.");
    } catch (error: unknown) {
      setMessage(
        error instanceof Error ? error.message : "Odjava trenutno nije moguća.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <section className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center">
        <h1 className="text-2xl font-bold">Odjava sa promotivnih poruka</h1>
        <p className="mt-3 text-slate-300">
          Odjavom isključujete NutriFlow promotivne poruke. Važne servisne
          poruke o nalogu i dalje mogu biti poslate.
        </p>
        {message ? (
          <p role="status" className="mt-6 text-emerald-300">{message}</p>
        ) : (
          <button
            type="button"
            onClick={unsubscribe}
            disabled={loading}
            className="mt-6 rounded-xl bg-emerald-500 px-6 py-3 font-bold text-slate-950 disabled:bg-slate-700"
          >
            {loading ? "Odjavljivanje..." : "Potvrdi odjavu"}
          </button>
        )}
      </section>
    </main>
  );
}
