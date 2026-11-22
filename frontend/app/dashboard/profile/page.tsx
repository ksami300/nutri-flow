"use client";

import { useState, useEffect } from "react";
import { UserProfileService } from "@/services/user-profile.service";
// ðŸ”Œ UVOZ NOVE KOMPONENTE ZA ASINHRONO STRIMOVANJE AVATARA
import AvatarUpload from "@/components/AvatarUpload";

interface UserProfile {
  name: string;
  email: string;
  joinedAt: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);

  const [weight, setWeight] = useState<string>("80");
  const [height, setHeight] = useState<string>("180");
  const [age, setAge] = useState<string>("25");
  const [gender, setGender] = useState<"MALE" | "FEMALE">("MALE");
  const [activityLevel, setActivityLevel] = useState<number>(1.55);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const parts = token.split(".");
          const payload: unknown = JSON.parse(atob(parts[1]));
          if (typeof payload === "object" && payload !== null) {
            const claims = payload as Record<string, unknown>;
            setProfile({
              name: typeof claims.name === "string" ? claims.name : "Korisnik",
              email: typeof claims.email === "string" ? claims.email : "",
              joinedAt: new Date().toLocaleDateString()
            });
          }
        } catch (err) {
          console.error("GreÅ¡ka pri Äitanju sesije", err);
        }
      }
      setLoading(false);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const handleUpdateMetrics = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);

    const result = await UserProfileService.updateMetrics({
      weight: Number(weight || 80), height: Number(height || 180), age: Number(age || 25),
      gender,
      activityLevel
    });

    if (result.success) {
      alert("ðŸŽ‰ Zdravstveni registri uspeÅ¡no aÅ¾urirani i preraÄunati u bazi podataka!");
    } else {
      alert(`âŒ GreÅ¡ka: ${result.message}`);
    }
    setSaveLoading(false);
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-slate-500 text-sm font-medium">
        UÄitavanje profila korisnika...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 text-white">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">KorisniÄki profil</h1>
        <p className="text-slate-400 text-sm">Pregled i upravljanje tvojim liÄnim parametrima i kalkulacijama ishrane.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEVA RADNA STRANA (AVATAR STRIM + OSNOVNE INFORMACIJE) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* BIN_AR_NA UPLOAD KOMPONENTA ZA AWS S3 KOHEZIJU */}
          <AvatarUpload />

          {/* KARTICA OSNOVNIH PODATAKA SESIJE */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-4 border-b border-slate-800 pb-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center font-black text-slate-950 text-base">
                {profile?.name.charAt(0).toUpperCase() || "N"}
              </div>
              <div>
                <h2 className="text-md font-bold truncate max-w-[150px]">{profile?.name || "Korisnik"}</h2>
                <p className="text-[11px] text-slate-400">Pristup: {profile?.joinedAt || "Danas"}</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                <span className="text-xs text-slate-400 block mb-1">E-mail adresa</span>
                <span className="font-medium text-slate-200 block truncate">{profile?.email || "Nije uneta"}</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                <span className="text-xs text-slate-400 block mb-1">Bezbednosni Status</span>
                <span className="font-medium text-emerald-400 flex items-center text-xs">âœ“ Validna Sesija</span>
              </div>
            </div>
          </div>
        </div>

        {/* FOR_MULAR ZA REFAKTORISAN_JE ZDRAVSTVENIH METRIKA */}
        <form onSubmit={handleUpdateMetrics} className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-bold border-b border-slate-800 pb-2">AÅ¾uriranje antropometrijskih registara</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Telesna teÅ¾ina (kg)</label>
              <input type="number" value={weight} onChange={(e) => setWeight(e.target.value.replace(/^0+(?=\d)/, ""))} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors" />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Visina tela (cm)</label>
              <input type="number" value={height} onChange={(e) => setHeight(e.target.value.replace(/^0+(?=\d)/, ""))} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors" />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Starost (godine)</label>
              <input type="number" value={age} onChange={(e) => setAge(e.target.value.replace(/^0+(?=\d)/, ""))} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors" />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">BioloÅ¡ki pol</label>
              <select value={gender} onChange={(e) => setGender(e.target.value as "MALE" | "FEMALE")} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors">
                <option value="MALE">MuÅ¡ki (BMR +5)</option>
                <option value="FEMALE">Å½enski (BMR -161)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Nivo mreÅ¾ne fiziÄke aktivnosti</label>
            <select value={activityLevel} onChange={(e) => setActivityLevel(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors">
              <option value={1.2}>Sedentarni stil (Minimalna aktivnost) - 1.2x</option>
              <option value={1.375}>Lagani trening (1-3 puta nedeljno) - 1.375x</option>
              <option value={1.55}>Umereni trening (3-5 puta nedeljno) - 1.55x</option>
              <option value={1.725}>Visoki intenzitet (6-7 puta nedeljno) - 1.725x</option>
              <option value={1.9}>Profesionalni nivo (TeÅ¾ak fiziÄki rad) - 1.9x</option>
            </select>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={saveLoading} className="py-3 px-6 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 text-slate-950 font-bold rounded-xl transition-all">
              {saveLoading ? "Sinhronizacija..." : "SaÄuvaj izmene"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

