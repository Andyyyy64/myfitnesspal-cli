import type { AuthConfig, FoodItem, SessionInfo } from "./types.js";
import { getSession, getCsrfToken, loginWithCredentials } from "./auth.js";
import { searchFood, fetchBuildId } from "./food.js";
import { saveAuth } from "../utils/config.js";

export class MFPClient {
  constructor(private config: AuthConfig) {}

  get sessionToken(): string {
    return this.config.sessionToken;
  }

  get cookieHeader(): string {
    return `__Secure-next-auth.session-token=${this.config.sessionToken}`;
  }

  async getSession(): Promise<SessionInfo> {
    return getSession(this.config);
  }

  async getCsrfToken(): Promise<string> {
    return getCsrfToken(this.config);
  }

  async searchFood(
    query: string,
    page = 0,
    perPage = 25
  ): Promise<{ items: FoodItem[]; total: number }> {
    const result = await searchFood(this.config, query, page, perPage);
    // Cache the buildId if it was refreshed
    if (result.buildId) {
      this.config.buildId = result.buildId;
      this.config.buildIdUpdatedAt = new Date().toISOString();
      await saveAuth(this.config);
    }
    return result;
  }

  static async login(
    email: string,
    password: string
  ): Promise<{ sessionToken: string }> {
    return loginWithCredentials(email, password);
  }
}

export { MFPClient as default };
