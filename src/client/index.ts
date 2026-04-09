import { SESSION_COOKIE_NAME } from "./constants.js";
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
import {
  readDiary,
  createDiaryEntry,
  deleteDiaryEntry,
  updateDiaryEntry,
  readDiaryNotes,
  addDiaryNote,
  copyMeal,
  completeDiaryDay,
} from "./diary.js";
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
    return `${SESSION_COOKIE_NAME}=${this.config.sessionToken}`;
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

  async updateDiaryEntry(
    entryId: string,
    updates: { servings?: number; serving_size_id?: string; meal_name?: string }
  ): Promise<DiaryEntry> {
    return updateDiaryEntry(this.config, entryId, updates);
  }

  async readDiaryNotes(date: string, noteType?: string): Promise<unknown> {
    return readDiaryNotes(this.config, date, noteType);
  }

  async addDiaryNote(data: { date: string; note: string; note_type?: string }): Promise<unknown> {
    return addDiaryNote(this.config, data);
  }

  async copyMeal(data: { from_date: string; to_date: string; from_meal: string; to_meal: string }): Promise<unknown> {
    return copyMeal(this.config, data);
  }

  async completeDiaryDay(date: string): Promise<unknown> {
    return completeDiaryDay(this.config, date);
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

