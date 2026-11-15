"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  MealPlanService,
  MealPlanResponse,
  MealPlanMetrics,
  MealPlanServiceError,
} from "@/services/meal-plan.service";
// 🔌 UVOZ NAŠE NOVE INTERAKTIVNE KOMPONENTE ZA HIDRACIJU
import WaterTracker from "@/components/WaterTracker";

export default function DashboardPage() {
  const [loading, setLoading] = useState<boolean>(false);
  const [plans, setPlans] = useState<MealPlanResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [accessExpired, setAccessExpired] = useState<boolean>(false);
  const [sharingPlanId, setSharingPlanId] = useState<string | null>(null);
  const [shareLinks, setShareLinks] = useState<Record<string, string>>({});
  const [shareError, setShareError] = useState<string | null>(null);
  const [copiedPlanId, setCopiedPlanId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<MealPlanMetrics>({
    weight: 80,
    height: 180,
    age: 25,
    gender: "male",
    activityLevel: "moderate",
    goal: "maintain",
    trainingDays: 3
  });

  useEffect(() => {
    async function loadData() {
      try {
        const history = await MealPlanService.getUserMealPlans();
        setPlans(history);
      } catch (loadError) {
        if (
          loadError instanceof MealPlanServiceError
          && loadError.code === "FREE_ACCESS_EXPIRED"
        ) {
          setAccessExpired(true);
        }
        setError(loadError instanceof Error ? loadError.message : "Neuspešno učitavanje planova.");
      }
    }
    loadData();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setAccessExpired(false);
    const result = await MealPlanService.generateMealPlan(metrics);
    if (result.success && result.data) {
      setPlans((prev) => [result.data!, ...prev]);
    } else {
      setError(result.message || "Plan ishrane nije mogao biti napravljen.");
      setAccessExpired(result.code === "FREE_ACCESS_EXPIRED");
    }
    setLoading(false);
  };

  const handleShare = async (planId: string) => {
    setSharingPlanId(planId);
    setShareError(null);
    setCopiedPlanId(null);

    try {
      const result = await MealPlanService.shareMealPlan(planId);
      setShareLinks((prev) => ({
        ...prev,
        [planId]: result.publicUrl,
      }));
    } catch (err: unknown) {
      setShareError(
        err instanceof Error ? err.message : "Deljenje plana nije uspelo."
      );
    } finally {
      setSharingPlanId(null);
    }
  };

  const handleCopyShareLink = async (planId: string) => {
    const url = shareLinks[planId];
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      setCopiedPlanId(planId);
      setShareError(null);
    } catch {
      setShareError("Kopiranje linka nije uspelo.");
    }
  };
  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">AI Meal Planning Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Generisanje personalizovanih planova ishrane i praćenje bio-metrika u realnom vremenu.</p>
        </div>

        {error && (
          <div role="alert" className="rounded-xl border border-rose-800 bg-rose-950/40 p-4 text-rose-200">
            <p>{error}</p>
            {accessExpired && (
              <Link href="/dashboard/billing" className="mt-2 inline-block font-semibold underline">
                Pogledaj Premium opcije
              </Link>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEVI RADNI PANEL (FORMULAR + VOD ZA HIDRACIJU) */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* COMPONENT 1: INTERAKTIVNI CORES MEHANIZAM ZA UNOS VODE */}
            <WaterTracker />

            {/* FORMULAR ZA UNOS ZDRAVSTVENIH METRIKA */}
            <form onSubmit={handleGenerate} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
              <h3 className="text-lg font-bold border-b border-slate-800 pb-2">Korisničke Metrike</h3>
              
              <div>
                <label className="text-xs text-slate-400 block mb-1">Težina (kg)</label>
                <input type="number" value={metrics.weight} onChange={(e) => setMetrics({...metrics, weight: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Visina (cm)</label>
                <input type="number" value={metrics.height} onChange={(e) => setMetrics({...metrics, height: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Starost (godine)</label>
                <input type="number" value={metrics.age} onChange={(e) => setMetrics({...metrics, age: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Pol</label>
                <select value={metrics.gender} onChange={(e) => setMetrics({...metrics, gender: e.target.value as MealPlanMetrics["gender"]})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white">
                  <option value="male">Muški</option>
                  <option value="female">Ženski</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Cilj</label>
                <select value={metrics.goal} onChange={(e) => setMetrics({...metrics, goal: e.target.value as MealPlanMetrics["goal"]})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white">
                  <option value="lose">Gubitak težine (Deficit)</option>
                  <option value="maintain">Održavanje kilaže</option>
                  <option value="gain">Izgradnja mišića (Suficit)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Nivo aktivnosti</label>
                <select value={metrics.activityLevel} onChange={(e) => setMetrics({...metrics, activityLevel: e.target.value as MealPlanMetrics["activityLevel"]})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white">
                  <option value="sedentary">Pretežno sedeći</option>
                  <option value="light">Lagana aktivnost</option>
                  <option value="moderate">Umerena aktivnost</option>
                  <option value="active">Visoka aktivnost</option>
                  <option value="veryActive">Veoma visoka aktivnost</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Dani treninga</label>
                <select value={metrics.trainingDays} onChange={(e) => setMetrics({...metrics, trainingDays: Number(e.target.value) as MealPlanMetrics["trainingDays"]})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white">
                  <option value={2}>2 dana nedeljno</option>
                  <option value={3}>3 dana nedeljno</option>
                </select>
              </div>

              <button type="submit" disabled={loading} className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 text-slate-950 font-bold rounded-xl transition-all">
                {loading ? "Kalkulacija u toku..." : "🥦 Generiši plan ishrane"}
              </button>
            </form>
          </div>

          {/* PRIKAZ ISTORIJE PLANOVA ISHRANE */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xl font-bold">Istorija tvojih planova ({plans.length})</h3>
            
            {plans.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500">
                Nemate generisanih planova ishrane. Popunite metrike levo.
              </div>
            ) : (
              plans.map((plan) => (
                <div key={plan._id} className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-emerald-400 font-extrabold text-lg">{plan.calories} kcal</span>
                    <span className="text-xs text-slate-500">{new Date(plan.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Proteini {plan.macros.protein} g · Ugljeni hidrati {plan.macros.carbs} g · Masti {plan.macros.fat} g
                  </p>
                  <div className="flex flex-wrap items-center gap-3 border-t border-slate-800 pt-4">
                    <button
                      type="button"
                      onClick={() => handleShare(plan._id)}
                      disabled={sharingPlanId === plan._id}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {sharingPlanId === plan._id
                        ? "Pravljenje linka..."
                        : shareLinks[plan._id]
                          ? "Osveži link"
                          : "Podeli plan"}
                    </button>

                    {shareLinks[plan._id] && (
                      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                        <a
                          href={shareLinks[plan._id]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-w-0 break-all text-sm text-emerald-400 underline"
                        >
                          {shareLinks[plan._id]}
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopyShareLink(plan._id)}
                          className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-800"
                        >
                          {copiedPlanId === plan._id ? "Kopirano" : "Kopiraj link"}
                        </button>
                      </div>
                    )}

                    {shareError && (
                      <p role="alert" className="w-full text-sm text-red-400">
                        {shareError}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {plan.weeklyPlan.map((day) => (
                      <section key={day.day} className="rounded-lg bg-slate-950 p-4">
                        <h4 className="mb-3 font-semibold text-emerald-300">{day.day}</h4>
                        <div className="space-y-3">
                          {day.meals.map((meal) => (
                            <div key={`${day.day}-${meal.type}`}>
                              <p className="text-sm font-medium">{meal.name} · {meal.totals.calories} kcal</p>
                              <ul className="mt-1 text-xs text-slate-400">
                                {meal.foods.map((food) => (
                                  <li key={`${food.name}-${food.grams}`}>
                                    {food.name} — {food.grams} g
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
