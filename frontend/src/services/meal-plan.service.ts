import { API_BASE_URL } from "@/lib/api-config";

export interface MealPlanMetrics {
  weight: number;
  height: number;
  age: number;
  gender: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'veryActive';
  goal: 'lose' | 'maintain' | 'gain';
  trainingDays: 2 | 3;
}

export interface PlannedMeal {
  type: string;
  name: string;
  foods: Array<{
    name: string;
    grams: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface MealPlanResponse {
  _id: string;
  calories: number;
  macros: { protein: number; carbs: number; fat: number };
  weeklyPlan: Array<{ day: string; meals: PlannedMeal[] }>;
  createdAt: string;
}

export interface PublicMealPlanResponse extends MealPlanResponse {
  goal: 'lose' | 'maintain' | 'gain';
  source?: string;
  isAIGenerated?: boolean;
}
export class MealPlanServiceError extends Error {
  constructor(message: string, readonly code?: string) {
    super(message);
    this.name = "MealPlanServiceError";
  }
}

export class MealPlanService {
  private static readonly API_BASE = `${API_BASE_URL}/meal-plans`;

  private static getHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") || "" : ""}`
    };
  }

  /**
   * 🥦 GENERISANJE NOVOG PLANA ISHRANE PREKO MIFFLIN-ST JEOR INFRASTRUKTURE
   */
  static async generateMealPlan(metrics: MealPlanMetrics): Promise<{
    success: boolean;
    data?: MealPlanResponse;
    message?: string;
    code?: string;
  }> {
    try {
      const response = await fetch(`${this.API_BASE}`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(metrics)
      });

      const result = await response.json();
      if (!response.ok) {
        return {
          success: false,
          message: result.error || result.message || "Generisanje plana ishrane nije uspelo",
          code: result.code,
        };
      }
      return { success: true, data: result.data };
    } catch (error: unknown) {
      console.error("🚨 [MEAL PLAN SERVICE GENERATE ERROR]:", error);
      return {
        success: false,
        message: error instanceof Error && error.message
          ? error.message
          : "Sistemska greška pri upisu plana",
        code: error instanceof MealPlanServiceError ? error.code : undefined,
      };
    }
  }

  /**
   * 📥 PREUZIMANJE SVIH KORISNIČKIH PLANOVA ISHRANE IZ CENTRALNE MONGO BAZE
   */
  static async getUserMealPlans(): Promise<MealPlanResponse[]> {
    const response = await fetch(`${this.API_BASE}`, {
      method: "GET",
      headers: this.getHeaders()
    });

    const result = await response.json();
    if (!response.ok) {
      throw new MealPlanServiceError(
        result.error || result.message || "Neuspešno učitavanje planova",
        result.code,
      );
    }
    if (!Array.isArray(result.data)) {
      throw new Error("Server je vratio neispravan format planova");
    }
    return result.data;
  }
  /**
   * 🔗 OMOGUĆAVANJE JAVNOG DELJENJA KORISNIČKOG PLANA
   */
  static async shareMealPlan(planId: string): Promise<{
    success: boolean;
    publicUrl: string;
    message?: string;
  }> {
    const response = await fetch(
      `${this.API_BASE}/${encodeURIComponent(planId)}/share`,
      {
        method: "POST",
        headers: this.getHeaders(),
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success || typeof result.publicUrl !== "string") {
      throw new MealPlanServiceError(
        result.message || result.error || "Deljenje plana nije uspelo",
        result.code
      );
    }

    return {
      success: true,
      publicUrl: result.publicUrl,
      message: result.message,
    };
  }

  /**
   * 🌐 JAVNO UČITAVANJE PLANA BEZ AUTENTIFIKACIJE
   */
  static async getPublicMealPlan(
    planId: string
  ): Promise<PublicMealPlanResponse> {
    const response = await fetch(
      `${API_BASE_URL}/public/share/${encodeURIComponent(planId)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success || !result.data) {
      throw new MealPlanServiceError(
        result.message || result.error || "Javni plan nije dostupan",
        result.code
      );
    }

    return result.data as PublicMealPlanResponse;
  }
}
