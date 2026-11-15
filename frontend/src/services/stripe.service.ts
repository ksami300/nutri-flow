import { API_BASE_URL } from "@/lib/api-config";

export interface SubscriptionDetails {
  active: boolean;
  plan: "FREE" | "PREMIUM";
}

export class StripeService {
  private static readonly API_BASE = `${API_BASE_URL}/payments`;

  private static getHeaders(): HeadersInit {
    const token = typeof window !== "undefined"
      ? localStorage.getItem("token") || ""
      : "";
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  static async createCheckoutSession(): Promise<string> {
    const response = await fetch(`${this.API_BASE}/checkout`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({}),
    });
    const result = await response.json();
    if (!response.ok || typeof result.url !== "string") {
      throw new Error(result.error || "Nije moguće pokrenuti Stripe naplatu.");
    }
    return result.url;
  }

  static async getSubscriptionStatus(): Promise<SubscriptionDetails> {
    const response = await fetch(`${this.API_BASE}/status`, {
      method: "GET",
      headers: this.getHeaders(),
    });
    const result = await response.json();
    if (!response.ok || typeof result.data?.isPremium !== "boolean") {
      throw new Error(result.error || "Nije moguće proveriti Premium status.");
    }
    return {
      active: result.data.isPremium,
      plan: result.data.isPremium ? "PREMIUM" : "FREE",
    };
  }

  static async createPortalSession(): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/billing/portal-session`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({}),
    });
    const result = await response.json();
    if (!response.ok || typeof result.url !== "string") {
      throw new Error(result.message || "Nije moguće otvoriti upravljanje pretplatom.");
    }
    return result.url;
  }
}
