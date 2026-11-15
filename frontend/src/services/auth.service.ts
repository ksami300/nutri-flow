import { API_BASE_URL } from "@/lib/api-config";

export interface AuthResponse {
  success: boolean;
  token?: string;
  message?: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export interface AccessStatus {
  isPremium: boolean;
  hasAccess: boolean;
  trialEndsAt: string | null;
}

export class AuthService {
  private static readonly API_BASE = `${API_BASE_URL}/auth`;

  /**
   * 🔑 KLIJENTSKI LOGIN VOD SA AUTOMATSKIM SKLADIŠTENJEM TOKENA
   */
  static async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Login neuspešan");

      if (result.data?.token) {
        localStorage.setItem("token", result.data.token);
        document.cookie = `token=${encodeURIComponent(result.data.token)}; Path=/; SameSite=Lax`;
      }
      return { success: true, user: result.data?.user };
    } catch (error: unknown) {
      console.error("🚨 [AUTH SERVICE LOGIN ERROR]:", error);
      return { success: false, message: error instanceof Error && error.message ? error.message : "Mrežna greška pri autorizaciji" };
    }
  }

  /**
   * 📝 KLIJENTSKI REGISTRACIONI PIPELINE KROZ CENTRALNI API GATEWAY
   */
  static async register(
    name: string,
    email: string,
    password: string,
    marketingConsent = false,
  ): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, marketingConsent })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Registracija neuspešna");
      return { success: true, message: result.message };
    } catch (error: unknown) {
      console.error("🚨 [AUTH SERVICE REGISTER ERROR]:", error);
      return { success: false, message: error instanceof Error && error.message ? error.message : "Mrežna greška pri upisu korisnika" };
    }
  }

  static async getAccessStatus(): Promise<AccessStatus> {
    const token = typeof window !== "undefined"
      ? localStorage.getItem("token") || ""
      : "";
    const response = await fetch(`${this.API_BASE}/access-status`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || result.message || "Nije moguće proveriti pristup nalogu.");
    }

    const status = result.data;
    if (
      typeof status?.isPremium !== "boolean"
      || typeof status?.hasAccess !== "boolean"
      || !(typeof status?.trialEndsAt === "string" || status?.trialEndsAt === null)
    ) {
      throw new Error("Server je vratio neispravan status pristupa.");
    }
    return {
      isPremium: status.isPremium,
      hasAccess: status.hasAccess,
      trialEndsAt: status.trialEndsAt,
    };
  }

  /**
   * 🚪 SIGURNO BRISANJE SESIJE I ODJAVA SA PLATFORME
   */
  static logout(): void {
    localStorage.removeItem("token");
    document.cookie = "token=; Path=/; Max-Age=0; SameSite=Lax";
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }
}
