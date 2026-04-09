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
  readDiaryDay,
  getDiaryNutrientGoals,
  getDiaryEntry,
  generateDiaryReport,
} from "./diary.js";
import { searchFood, fetchBuildId } from "./food.js";
import {
  getMeasurements,
  upsertMeasurement,
  deleteMeasurement,
  getMeasurementTypes,
  createMeasurementType,
  deleteMeasurementType,
  getMeasurementById,
} from "./measurement.js";
import { readWater, logWater } from "./water.js";
import {
  searchExercises,
  logExercise,
  deleteExercise,
  lookupExercises,
  lookupPrivateExercises,
  getCaloriesBurned,
  updateExercise,
  getExerciseById,
} from "./exercise.js";
import type { ExerciseSearchResult } from "./exercise.js";
import { getNutrientGoals, updateNutrientGoals } from "./goals.js";
import {
  getFoodById,
  getMyFoods,
  createCustomFood,
  updateCustomFood,
  deleteCustomFood,
  getTopFoods,
} from "./foods.js";
import { getSavedMeals, deleteSavedMeal } from "./meals.js";
import {
  getDiarySettings,
  updateDiarySettings,
  getUserProfile,
  updateUserProfile,
  requestDataExport,
  getWeeklyDigest,
  getDiaryProfile,
  getReport,
} from "./account.js";
import type { SavedMeal } from "./meals.js";
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
    food_version?: string;
    serving_size: { nutrition_multiplier: number; unit: string; value: number };
    servings: number;
    meal_position: number;
    date: string;
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

  async lookupExercises(): Promise<ExerciseSearchResult[]> {
    return lookupExercises(this.config);
  }

  async lookupPrivateExercises(): Promise<ExerciseSearchResult[]> {
    return lookupPrivateExercises(this.config);
  }

  async getCaloriesBurned(exerciseId: string): Promise<unknown> {
    return getCaloriesBurned(this.config, exerciseId);
  }

  async updateExercise(exerciseId: string, updates: Record<string, unknown>): Promise<ExerciseEntry> {
    return updateExercise(this.config, exerciseId, updates);
  }

  async getNutrientGoals(date?: string): Promise<NutrientGoals> {
    return getNutrientGoals(this.config, date);
  }

  async getFoodById(foodId: string): Promise<FoodItem> {
    return getFoodById(this.config, foodId);
  }

  async getMyFoods(): Promise<FoodItem[]> {
    return getMyFoods(this.config);
  }

  async createCustomFood(food: {
    description: string;
    brand_name?: string;
    serving_sizes: Array<{ unit: string; value: number; nutrition_multiplier: number }>;
    nutritional_contents: Record<string, unknown>;
  }): Promise<FoodItem> {
    return createCustomFood(this.config, food);
  }

  async updateCustomFood(foodId: string, updates: Record<string, unknown>): Promise<FoodItem> {
    return updateCustomFood(this.config, foodId, updates);
  }

  async deleteCustomFood(foodId: string): Promise<void> {
    return deleteCustomFood(this.config, foodId);
  }

  async getTopFoods(fromDate: string, toDate: string, lists?: string[]): Promise<unknown> {
    return getTopFoods(this.config, fromDate, toDate, lists);
  }

  async getSavedMeals(): Promise<SavedMeal[]> {
    return getSavedMeals(this.config);
  }

  async deleteSavedMeal(mealId: string): Promise<void> {
    return deleteSavedMeal(this.config, mealId);
  }

  async getMeasurementTypes(): Promise<unknown[]> {
    return getMeasurementTypes(this.config);
  }

  async createMeasurementType(type: { name: string }): Promise<unknown> {
    return createMeasurementType(this.config, type);
  }

  async deleteMeasurementType(typeId: string): Promise<void> {
    return deleteMeasurementType(this.config, typeId);
  }

  async updateNutrientGoals(updates: { calories?: number; protein?: number; carbs?: number; fat?: number }): Promise<unknown> {
    return updateNutrientGoals(this.config, updates);
  }

  async getDiarySettings(): Promise<unknown> {
    return getDiarySettings(this.config);
  }

  async updateDiarySettings(settings: Record<string, unknown>): Promise<unknown> {
    return updateDiarySettings(this.config, settings);
  }

  async getUserProfile(): Promise<unknown> {
    return getUserProfile(this.config);
  }

  async updateUserProfile(updates: Record<string, unknown>): Promise<unknown> {
    return updateUserProfile(this.config, updates);
  }

  async requestDataExport(): Promise<unknown> {
    return requestDataExport(this.config);
  }

  async getWeeklyDigest(fromDate: string, toDate: string): Promise<unknown> {
    return getWeeklyDigest(this.config, fromDate, toDate);
  }

  async getDiaryProfile(): Promise<unknown> {
    return getDiaryProfile(this.config);
  }

  async getReport(reportType: string, reportName: string, reportLength: string): Promise<unknown> {
    return getReport(this.config, reportType, reportName, reportLength);
  }

  async readDiaryDay(date: string): Promise<unknown> {
    return readDiaryDay(this.config, date);
  }

  async getDiaryNutrientGoals(date: string): Promise<unknown> {
    return getDiaryNutrientGoals(this.config, date);
  }

  async getDiaryEntry(entryId: string): Promise<DiaryEntry> {
    return getDiaryEntry(this.config, entryId);
  }

  async generateDiaryReport(data: Record<string, unknown>): Promise<unknown> {
    return generateDiaryReport(this.config, data);
  }

  async getExerciseById(exerciseId: string): Promise<ExerciseSearchResult> {
    return getExerciseById(this.config, exerciseId);
  }

  async getMeasurementById(id: string): Promise<MeasurementEntry> {
    return getMeasurementById(this.config, id);
  }

  static async login(
    email: string,
    password: string
  ): Promise<{ sessionToken: string }> {
    return loginWithCredentials(email, password);
  }
}

