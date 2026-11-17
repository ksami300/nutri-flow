"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  MealPlanService,
  MealPlanResponse,
  MealPlanMetrics,
  MealPlanServiceError,
} from "@/services/meal-plan.service";
import WaterTracker from "@/components/WaterTracker";

const FOOD_LABELS_SR: Record<string, string> = {
  "Whole Eggs": "Cela jaja",
  "Egg Whites": "Belanca",
  "Oatmeal": "Ovsene pahuljice",
  "Greek Yogurt": "Grčki jogurt",
  "Young Cheese": "Mladi sir",
  "Whole Wheat Bread": "Integralni hleb / kifla",
  "Protein Powder": "Whey protein (merica)",
  "Low-Fat Milk": "Mleko",
  "Peanut Butter": "Kikiriki puter",
  "Almonds": "Bademi (Almonds)",
  "Apple": "Jabuka",
  "Banana": "Banana",
  "Chicken Breast": "Pileće belo meso",
  "Lean Beef Burger": "Juneća pljeskavica (čisto meso)",
  "White Rice": "Pirinač",
  "Potatoes": "Krompir (pečeni / kuvani)",
  "Fresh Green Salad": "Zelena salata i sveže povrće",
  "Turkey Breast": "Ćureće belo meso",
  "Tuna": "Tunjevina",
  "Olive Oil": "Maslinovo ulje",
};

const QUICK_EXCLUDES = [
  { id: "Almonds", sr: "Bez badema", en: "No almonds" },
  { id: "Tuna", sr: "Bez tunjevine / ribe", en: "No tuna / fish" },
  { id: "Peanut Butter", sr: "Bez kikiriki putera", en: "No peanut butter" },
  { id: "Young Cheese", sr: "Bez mladog sira", en: "No young cheese" },
  { id: "Protein Powder", sr: "Bez whey proteina", en: "No whey protein" },
];

export default function DashboardPage() {
  const [lang, setLang] = useState<"SR" | "EN">("SR");
  const [unitSystem, setUnitSystem] = useState<"METRIC" | "IMPERIAL">("METRIC");
  const [loading, setLoading] = useState<boolean>(false);
  const [plans, setPlans] = useState<MealPlanResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [accessExpired, setAccessExpired] = useState<boolean>(false);
  const [sharingPlanId, setSharingPlanId] = useState<string | null>(null);
  const [shareLinks, setShareLinks] = useState<Record<string, string>>({});
  const [copiedPlanId, setCopiedPlanId] = useState<string | null>(null);
  const [reminderActive, setReminderActive] = useState<boolean>(false);

  const [weightKg, setWeightKg] = useState<number>(85);
  const [heightCm, setHeightCm] = useState<number>(180);
  const [weightLbs, setWeightLbs] = useState<number>(187);
  const [heightFt, setHeightFt] = useState<number>(5);
  const [heightIn, setHeightIn] = useState<number>(11);

  const [age, setAge] = useState<number>(28);
  const [gender, setGender] = useState<"male" | "female">("male");
  const [activityLevel, setActivityLevel] = useState<string>("active");
  const [goal, setGoal] = useState<"lose" | "gain" | "maintain">("maintain");
  const [trainingDays, setTrainingDays] = useState<number>(4);
  const [dietType, setDietType] = useState<"standard" | "keto" | "vegan" | "high-protein">("high-protein");
  const [healthConditions, setHealthConditions] = useState<string[]>([]);
  const [excludedFoods, setExcludedFoods] = useState<string[]>([]);
  const [customNote, setCustomNote] = useState<string>("");

  useEffect(() => {
    async function loadData() {
      try {
        const history = await MealPlanService.getUserMealPlans();
        setPlans(history);
      } catch (loadError) {
        if (loadError instanceof MealPlanServiceError && loadError.code === "FREE_ACCESS_EXPIRED") {
          setAccessExpired(true);
        }
        setError(loadError instanceof Error ? loadError.message : "Neuspešno učitavanje planova.");
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!reminderActive) return;
    const interval = setInterval(() => {
      toast(
        lang === "SR"
          ? "Podsetnik: Popij čašu vode (250-500 ml) i zabeleži obrok. Žeđ često maskira lažnu glad!"
          : "Reminder: Drink a glass of water (8-16 oz) and log your meal. Thirst often mimics hunger!",
        { icon: "💧", duration: 6000 }
      );
    }, 90 * 60 * 1000);
    return () => clearInterval(interval);
  }, [reminderActive, lang]);

  const toggleReminder = () => {
    const next = !reminderActive;
    setReminderActive(next);
    if (next) toast.success(lang === "SR" ? "Podsetnik za vodu i obroke je uključen!" : "Hydration reminder enabled!");
  };

  const toggleCondition = (cond: string) => {
    setHealthConditions((prev) => (prev.includes(cond) ? prev.filter((c) => c !== cond) : [...prev, cond]));
  };

  const toggleExcludeFood = (foodName: string) => {
    setExcludedFoods((prev) => (prev.includes(foodName) ? prev.filter((f) => f !== foodName) : [...prev, foodName]));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setAccessExpired(false);
    const finalWeightKg = unitSystem === "METRIC" ? Number(weightKg) : Math.round(Number(weightLbs) * 0.453592 * 10) / 10;
    const finalHeightCm = unitSystem === "METRIC" ? Number(heightCm) : Math.round((Number(heightFt) * 12 + Number(heightIn)) * 2.54);
    const payload = {
      weight: finalWeightKg, height: finalHeightCm, age: Number(age), gender, activityLevel, goal,
      trainingDays: Number(trainingDays),
      preferences: { dietType, excludedFoods, healthConditions, customNote, market: lang },
    } as unknown as MealPlanMetrics;
    const result = await MealPlanService.generateMealPlan(payload);
    if (result.success && result.data) {
      setPlans((prev) => [result.data!, ...prev]);
      toast.success(lang === "SR" ? "Odlično! Tvoj personalizovani plan je spreman." : "Awesome! Your meal plan is ready.");
    } else {
      setError(result.message || "Plan ishrane nije mogao biti napravljen.");
      setAccessExpired(result.code === "FREE_ACCESS_EXPIRED");
    }
    setLoading(false);
  };

  const handleShare = async (planId: string) => {
    setSharingPlanId(planId);
    setCopiedPlanId(null);
    try {
      const result = await MealPlanService.shareMealPlan(planId);
      setShareLinks((prev) => ({ ...prev, [planId]: result.publicUrl }));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Deljenje plana nije uspelo.");
    } finally {
      setSharingPlanId(null);
    }
  };

  const handleCopyShareLink = async (planId: string, url: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedPlanId(planId);
    toast.success(lang === "SR" ? "Link je kopiran!" : "Link copied!");
  };

  const formatFoodName = (name: string) => (lang === "SR" && FOOD_LABELS_SR[name] ? FOOD_LABELS_SR[name] : name);
  const formatAmount = (grams: number) => (unitSystem === "IMPERIAL" ? `${(grams * 0.035274).toFixed(1)} oz (${grams}g)` : `${grams} g`);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/20 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                {lang === "SR" ? "Bez gladovanja • Realna hrana • Trening & Hidracija" : "No Starvation Myths • Real Food • Training & Hydration"}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {lang === "SR" ? "Tvoje telo je precizna mašina — daj mu pravo gorivo." : "Your body is a precision machine — give it the right fuel."}
              </h1>
              <p className="text-sm text-slate-300 max-w-2xl">
                {lang === "SR"
                  ? "Svaki obrok, čaša vode i trening grade tvoju formu. Nema ekstremnih dijeta ni skupih egzotičnih namirnica — samo proverena hrana koju već imaš kod kuće."
                  : "Every meal, glass of water, and workout builds your strength. No extreme starvation diets — just practical everyday foods tailored to your goals."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                <button type="button" onClick={() => setLang("SR")} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${lang === "SR" ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-white"}`}>SR (Srbija)</button>
                <button type="button" onClick={() => setLang("EN")} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${lang === "EN" ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-white"}`}>EN (US / Global)</button>
              </div>
              <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                <button type="button" onClick={() => setUnitSystem("METRIC")} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${unitSystem === "METRIC" ? "bg-blue-500 text-white" : "text-slate-400 hover:text-white"}`}>kg / cm</button>
                <button type="button" onClick={() => setUnitSystem("IMPERIAL")} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${unitSystem === "IMPERIAL" ? "bg-blue-500 text-white" : "text-slate-400 hover:text-white"}`}>lbs / ft-in</button>
              </div>
              <button type="button" onClick={toggleReminder} className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition ${reminderActive ? "bg-cyan-500/20 border-cyan-400 text-cyan-200" : "bg-slate-950 border-slate-700 text-slate-300 hover:border-cyan-500"}`}>
                {reminderActive ? (lang === "SR" ? "Podsetnik aktivan" : "Reminder ON") : (lang === "SR" ? "Uključi podsetnik za vodu" : "Enable Water Reminder")}
              </button>
              <Link href="/dashboard/coach" className="px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold hover:bg-emerald-500/25 transition">AI Coach</Link>
            </div>
          </div>
          <div className="text-xs text-slate-400 bg-slate-950/70 border border-slate-800/80 rounded-2xl px-4 py-2.5">
            {lang === "SR"
              ? "Napomena: NutriFlow je visokotehnološki asistent za organizaciju ishrane, sporta i hidracije (nismo nutricionisti i aplikacija ne zamenjuje savet lekara). Ukoliko imaš šećer, visok pritisak ili holesterol, označi to ispod kako bi algoritam prilagodio namirnice."
              : "Disclaimer: NutriFlow is a high-tech assistant for balanced nutrition, training, and hydration (we are not licensed nutritionists and this does not replace medical advice). Select any health notes below so the engine filters foods safely."}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleGenerate} className="lg:col-span-2 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">{lang === "SR" ? "Kreiraj svoj realan plan ishrane" : "Build Your Practical Meal Plan"}</h2>
              <span className="text-xs text-emerald-400 font-semibold">{lang === "SR" ? "Prilagođeno tvojim namirnicama" : "Tailored to your kitchen"}</span>
            </div>
            {error && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/40 text-red-300 text-sm">
                {error}
                {accessExpired && <Link href="/dashboard/billing" className="underline font-bold ml-2">{lang === "SR" ? "Aktiviraj pristup" : "Upgrade access"}</Link>}
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {unitSystem === "METRIC" ? (
                <>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">{lang === "SR" ? "Težina (kg)" : "Weight (kg)"}</label>
                    <input type="number" min={35} max={250} value={weightKg} onChange={(e) => setWeightKg(Number(e.target.value))} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold" required />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">{lang === "SR" ? "Visina (cm)" : "Height (cm)"}</label>
                    <input type="number" min={120} max={240} value={heightCm} onChange={(e) => setHeightCm(Number(e.target.value))} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold" required />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Weight (lbs)</label>
                    <input type="number" min={80} max={550} value={weightLbs} onChange={(e) => setWeightLbs(Number(e.target.value))} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold" required />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Height (ft)</label>
                      <input type="number" min={4} max={7} value={heightFt} onChange={(e) => setHeightFt(Number(e.target.value))} className="w-full px-2.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold" required />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">(in)</label>
                      <input type="number" min={0} max={11} value={heightIn} onChange={(e) => setHeightIn(Number(e.target.value))} className="w-full px-2.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold" required />
                    </div>
                  </div>
                </>
              )}
              <div>
                <label className="block text-xs text-slate-400 mb-1">{lang === "SR" ? "Godine" : "Age"}</label>
                <input type="number" min={14} max={95} value={age} onChange={(e) => setAge(Number(e.target.value))} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold" required />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">{lang === "SR" ? "Pol" : "Gender"}</label>
                <select value={gender} onChange={(e) => setGender(e.target.value as "male" | "female")} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold">
                  <option value="male">{lang === "SR" ? "Muški" : "Male"}</option>
                  <option value="female">{lang === "SR" ? "Ženski" : "Female"}</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">{lang === "SR" ? "Nivo aktivnosti / sport" : "Activity & Sport Level"}</label>
                <select value={activityLevel} onChange={(e) => setActivityLevel(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm">
                  <option value="sedentary">{lang === "SR" ? "Slabo kretanje" : "Sedentary"}</option>
                  <option value="light">{lang === "SR" ? "Lagana aktivnost (1-2x)" : "Light (1-2x/wk)"}</option>
                  <option value="moderate">{lang === "SR" ? "Umerena (3-4x nedeljno)" : "Moderate (3-4x/wk)"}</option>
                  <option value="active">{lang === "SR" ? "Aktivno (4-5x trening)" : "Active (4-5x/wk)"}</option>
                  <option value="veryActive">{lang === "SR" ? "Vrlo aktivno (svakodnevno)" : "Very Active (Daily)"}</option>
                  <option value="athlete">{lang === "SR" ? "Sportista / Težak rad (4500-5200 kcal)" : "Athlete / Heavy Training (5000+ kcal)"}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">{lang === "SR" ? "Tvoj cilj" : "Your Goal"}</label>
                <select value={goal} onChange={(e) => setGoal(e.target.value as "lose" | "gain" | "maintain")} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm">
                  <option value="lose">{lang === "SR" ? "Zdravo mršavljenje (bez gladovanja)" : "Healthy Fat Loss"}</option>
                  <option value="maintain">{lang === "SR" ? "Održavanje snage i energije" : "Maintain Strength & Energy"}</option>
                  <option value="gain">{lang === "SR" ? "Dobijanje mišićne mase" : "Build Lean Muscle"}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">{lang === "SR" ? "Stil ishrane" : "Diet Style"}</label>
                <select value={dietType} onChange={(e) => setDietType(e.target.value as "standard" | "keto" | "vegan" | "high-protein")} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm">
                  <option value="high-protein">{lang === "SR" ? "Visok unos proteina (Preporuka)" : "High-Protein (Recommended)"}</option>
                  <option value="standard">{lang === "SR" ? "Balansirana domaća ishrana" : "Balanced Everyday"}</option>
                  <option value="keto">{lang === "SR" ? "Low-Carb / Keto" : "Low-Carb / Keto"}</option>
                  <option value="vegan">{lang === "SR" ? "Posno / Biljna ishrana" : "Plant-Based / Vegan"}</option>
                </select>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">{lang === "SR" ? "Zdravstvene napomene (automatska zaštita namirnica)" : "Health Notes (Automatic Smart Food Filtering)"}</div>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "diabetes", sr: "Povišen šećer / Dijabetes (bez banana i prostih šećera)", en: "Blood Sugar / Diabetes (no high-GI fruits)" },
                  { id: "hypertension", sr: "Visok pritisak (manje soli / natrijuma)", en: "High Blood Pressure (low sodium)" },
                  { id: "cholesterol", sr: "Holesterol (belanca umesto žumanaca, posno meso)", en: "Cholesterol (egg whites & lean meats)" },
                ].map((item) => {
                  const active = healthConditions.includes(item.id);
                  return (
                    <button key={item.id} type="button" onClick={() => toggleCondition(item.id)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${active ? "bg-amber-500/20 border-amber-400 text-amber-200" : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"}`}>
                      {active ? "✓ " : "+ "}{lang === "SR" ? item.sr : item.en}
                    </button>
                  );
                })}
              </div>
              <div className="pt-1">
                <div className="text-xs text-slate-400 mb-2">{lang === "SR" ? "Nemaš neku namirnicu kod kuće ili je ne voliš? Klikni da je izbaciš:" : "Missing something in your kitchen or dislike it? Click to exclude:"}</div>
                <div className="flex flex-wrap gap-2">
                  {QUICK_EXCLUDES.map((f) => {
                    const active = excludedFoods.includes(f.id);
                  return (
                      <button key={f.id} type="button" onClick={() => toggleExcludeFood(f.id)} className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${active ? "bg-rose-500/20 border-rose-400 text-rose-200" : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"}`}>
                        {active ? "✕ " : ""}{lang === "SR" ? f.sr : f.en}
                      </button>
                    );
                  })}
                </div>
              </div>
              <input type="text" value={customNote} onChange={(e) => setCustomNote(e.target.value)} placeholder={lang === "SR" ? "Dodatna napomena (npr. nemam bademe, izbaci tunjevinu, više jaja i piletine...)" : "Additional note (e.g. no almonds, exclude tuna, prefer chicken and eggs...)"} className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50">
              {loading ? (lang === "SR" ? "Pravim tvoj plan..." : "Building your plan...") : (lang === "SR" ? "Generiši moj realan plan ishrane" : "Generate My Practical Meal Plan")}
            </button>
          </form>
          <div className="space-y-6">
            <WaterTracker />
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
              <h3 className="text-sm font-bold text-cyan-300">{lang === "SR" ? "Zašto je voda ključna?" : "Why Hydration Comes First?"}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{lang === "SR" ? "Centar za glad i žeđ u mozgu šalju sličan signal. Pre nego što posegneš za grickalicama, popij 300 ml vode i sačekaj 10 minuta — u 70% slučajeva organizam je samo tražio tečnost." : "Your brain often confuses mild dehydration with hunger. Before reaching for extra snacks, drink 10 oz of water and wait 10 minutes."}</p>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          {plans.map((plan) => (
            <div key={plan._id} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">{lang === "SR" ? "Aktivni plan ishrane • Realne namirnice" : "Active Meal Plan • Everyday Foods"}</div>
                  <div className="text-2xl font-black text-white mt-1">{plan.calories} kcal / {lang === "SR" ? "dan" : "day"}</div>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-300 mt-1">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">Protein: <strong className="text-emerald-400">{plan.macros.protein}g</strong></span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">{lang === "SR" ? "Ugljeni hidrati" : "Carbs"}: <strong className="text-blue-400">{plan.macros.carbs}g</strong></span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">{lang === "SR" ? "Masti" : "Fats"}: <strong className="text-amber-400">{plan.macros.fat}g</strong></span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => handleShare(plan._id)} disabled={sharingPlanId === plan._id} className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 hover:border-emerald-400 text-xs font-bold text-white transition">{sharingPlanId === plan._id ? "..." : (lang === "SR" ? "Podeli plan" : "Share Plan")}</button>
                  {shareLinks[plan._id] && <button type="button" onClick={() => handleCopyShareLink(plan._id, shareLinks[plan._id])} className="px-3 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold">{copiedPlanId === plan._id ? "✓" : (lang === "SR" ? "Kopiraj link" : "Copy Link")}</button>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plan.weeklyPlan?.[0]?.meals?.map((meal, idx) => (
                  <div key={`${plan._id}-meal-${idx}`} className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-emerald-300">{meal.type === "breakfast" ? (lang === "SR" ? "Doručak" : "Breakfast") : meal.type === "lunch" ? (lang === "SR" ? "Ručak" : "Lunch") : meal.type === "dinner" ? (lang === "SR" ? "Večera" : "Dinner") : (lang === "SR" ? "Užina" : "Snack")}</span>
                      <span className="text-xs font-semibold text-slate-400">{Math.round(meal.totals?.calories || 0)} kcal</span>
                    </div>
                    <ul className="space-y-2">
                      {meal.foods?.map((food, fIdx) => (
                        <li key={`${plan._id}-m-${idx}-f-${fIdx}`} className="flex items-center justify-between text-xs bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-800/60">
                          <span className="font-semibold text-slate-100">{formatFoodName(food.name)}</span>
                          <span className="text-slate-400">{formatAmount(food.grams)} • P:{Math.round(food.protein)}g</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

