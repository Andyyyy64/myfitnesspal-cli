import type { AuthConfig, DiaryEntry, FoodItem, SessionInfo } from "./types.js";
import { getSession, getCsrfToken, loginWithCredentials } from "./auth.js";
import { readDiary, createDiaryEntry, deleteDiaryEntry } from "./diary.js";
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

  async readDiary(date: string): Promise<DiaryEntry[]> {
    return readDiary(this.config, date);
  }

  async createDiaryEntry(entry: {
    food_id: string;
    serving_size_id: string;
    servings: number;
    meal_name: string;
    entry_date: string;
  }): Promise<DiaryEntry> {
    return createDiaryEntry(this.config, entry);
  }

  async deleteDiaryEntry(entryId: string): Promise<void> {
    return deleteDiaryEntry(this.config, entryId);
  }

  static async login(
    email: string,
    password: string
  ): Promise<{ sessionToken: string }> {
    return loginWithCredentials(email, password);
  }
}

export { MFPClient as default };
