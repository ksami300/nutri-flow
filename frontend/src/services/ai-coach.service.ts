import { API_BASE_URL } from "@/lib/api-config";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export class AiCoachService {
  private static readonly API_BASE = `${API_BASE_URL}/ai`;

  private static getHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") || "" : ""}`
    };
  }

  /**
   * 🤖 SLANJE UPITA KORISNIKA KA AI NUTRICIONISTIČKOM EKSPERTU
   */
  static async sendMessage(history: ChatMessage[]): Promise<{ success: boolean; reply?: string; message?: string }> {
    try {
      const response = await fetch(`${this.API_BASE}/coach`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ messages: history })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          result.error || result.message || "AI podsistem trenutno ne odgovara",
        );
      }
      return { success: true, reply: result.data.reply };
    } catch (error: unknown) {
      console.error("🚨 [AI COACH SERVICE ERROR]:", error);
      return { success: false, message: error instanceof Error && error.message ? error.message : "Greška pri uspostavljanju veze sa AI modelom" };
    }
  }
}
