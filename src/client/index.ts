import type {
  AuthConfig,
  DiaryEntry,
  ExerciseEntry,
  FoodItem,
  MeasurementEntry,
  NutrientGoals,
  SessionInfo,
  WaterEntry,
} from "./types.js";
import { getSession, getCsrfToken, loginWithCredentials } from "./auth.js";
import { readDiary, createDiaryEntry, deleteDiaryEntry } from "./diary.js";
import { searchFood, fetchBuildId } from "./food.js";
import {
  getMeasurements,
  upsertMeasurement,
  deleteMeasurement,
} from "./measurement.js";
import { readWater, logWater } from "./water.js";
import {
  searchExercises,
  logExercise,
  deleteExercise,
} from "./exercise.js";
import type { ExerciseSearchResult } from "./exercise.js";
import { getNutrientGoals } from "./goals.js";
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

  async getMeasurements(): Promise<MeasurementEntry[]> {
    return getMeasurements(this.config);
  }

  async upsertMeasurement(measurement: {
    type: string;
    value: number;
    unit: string;
    date: string;
  }): Promise<MeasurementEntry> {
    return upsertMeasurement(this.config, measurement);
  }

  async deleteMeasurement(id: string): Promise<void> {
    return deleteMeasurement(this.config, id);
  }

  async readWater(date: string): Promise<WaterEntry> {
    return readWater(this.config, date);
  }

  async logWater(cups: number, date: string): Promise<WaterEntry> {
    return logWater(this.config, { cups, date });
  }

  async searchExercises(query: string): Promise<ExerciseSearchResult[]> {
    return searchExercises(this.config, query);
  }

  async logExercise(exercise: {
    exercise_id: string;
    duration_minutes: number;
    calories_burned?: number;
    date: string;
  }): Promise<ExerciseEntry> {
    return logExercise(this.config, exercise);
  }

  async deleteExercise(id: string): Promise<void> {
    return deleteExercise(this.config, id);
  }

  async getNutrientGoals(date?: string): Promise<NutrientGoals> {
    return getNutrientGoals(this.config, date);
  }

  static async login(
    email: string,
    password: string
  ): Promise<{ sessionToken: string }> {
    return loginWithCredentials(email, password);
  }
}

export { MFPClient as default };
