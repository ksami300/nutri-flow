"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  MealPlanService,
  type PublicMealPlanResponse,
} from "@/services/meal-plan.service";

const goalLabels: Record<string, string> = {
  lose: "Gubitak telesne mase",
  maintain: "Održavanje telesne mase",
  gain: "Povećanje mišićne mase",
};

export default function SharedMealPlanPage() {
  const params = useParams<{ id: string }>();
  const planId = params.id;

  const [plan, setPlan] = useState<PublicMealPlanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!planId) return;

    let active = true;

    setLoading(true);
    setError("");

    MealPlanService.getPublicMealPlan(planId)
      .then((result) => {
        if (active) setPlan(result);
      })
      .catch((err: unknown) => {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : "Plan ishrane nije dostupan ili više nije javan."
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [planId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <p className="text-slate-300">Učitavanje plana ishrane...</p>
      </main>
    );
  }

  if (error || !plan) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <section className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
          <h1 className="text-2xl font-bold">Plan nije dostupan</h1>
          <p className="mt-3 text-slate-400">
            {error || "Ovaj plan ne postoji ili nije javno dostupan."}
          </p>
          <a
            href="/"
            className="mt-6 inline-block rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-500"
          >
            Početna stranica
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
            NutriFlow
          </p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            Podeljeni plan ishrane
          </h1>
          <p className="mt-3 text-slate-400">
            {goalLabels[plan.goal] || plan.goal}
            {" · "}
            {new Date(plan.createdAt).toLocaleDateString("sr-RS")}
          </p>
        </header>

        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 sm:col-span-1">
            <p className="text-sm text-slate-400">Dnevne kalorije</p>
            <p className="mt-2 text-3xl font-bold text-emerald-400">
              {plan.calories}
            </p>
            <p className="text-sm text-slate-500">kcal</p>
          </div>

          {[
            { label: "Proteini", value: plan.macros.protein },
            { label: "Ugljeni hidrati", value: plan.macros.carbs },
            { label: "Masti", value: plan.macros.fat },
          ].map((macro) => (
            <div
              key={macro.label}
              className="rounded-xl border border-slate-800 bg-slate-900 p-5"
            >
              <p className="text-sm text-slate-400">{macro.label}</p>
              <p className="mt-2 text-3xl font-bold">{macro.value} g</p>
            </div>
          ))}
        </section>

        <section className="space-y-6">
          {plan.weeklyPlan.map((day, dayIndex) => (
            <article
              key={`${day.day}-${dayIndex}`}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-7"
            >
              <h2 className="mb-5 text-xl font-bold text-emerald-400">
                {day.day}
              </h2>

              <div className="space-y-5">
                {day.meals.map((meal, mealIndex) => (
                  <div
                    key={`${meal.type}-${mealIndex}`}
                    className="border-t border-slate-800 pt-4 first:border-0 first:pt-0"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-semibold">{meal.name}</h3>
                      <span className="text-sm text-slate-400">
                        {meal.totals.calories} kcal
                      </span>
                    </div>

                    <ul className="mt-3 space-y-2">
                      {meal.foods.map((food, foodIndex) => (
                        <li
                          key={`${food.name}-${foodIndex}`}
                          className="flex flex-wrap justify-between gap-2 text-sm text-slate-300"
                        >
                          <span>{food.name}</span>
                          <span className="text-slate-400">
                            {food.grams} g
                          </span>
                        </li>
                      ))}
                    </ul>

                    <p className="mt-3 text-xs text-slate-500">
                      Proteini: {meal.totals.protein} g · UH:{" "}
                      {meal.totals.carbs} g · Masti: {meal.totals.fat} g
                    </p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>

        <footer className="mt-10 border-t border-slate-800 py-6 text-center text-sm text-slate-500">
          Plan je podeljen putem NutriFlow aplikacije.
        </footer>
      </div>
    </main>
  );
}