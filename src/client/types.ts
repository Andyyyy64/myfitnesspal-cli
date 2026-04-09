export interface AuthConfig {
  sessionToken: string;
  buildId?: string;
  buildIdUpdatedAt?: string;
  userId?: string;
}

export interface NutritionalContents {
  energy?: { value: number; unit: string };
  protein?: number;
  carbohydrates?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  [key: string]: unknown;
}

export interface ServingSize {
  id: string;
  unit: string;
  value: number;
  nutrition_multiplier: number;
}

export interface FoodItem {
  id: string;
  description: string;
  brand_name?: string;
  /** @deprecated Use brand_name instead */
  brand?: string;
  type: string;
  verified: boolean;
  nutritional_contents: NutritionalContents;
  serving_sizes: ServingSize[];
  country_code?: string;
  deleted?: boolean;
  public?: boolean;
  user_id?: string;
  version?: string;
}

export interface DiaryEntry {
  id: string;
  food: FoodItem;
  serving_size: ServingSize;
  servings: number;
  meal_name: string;
  entry_date: string;
  nutritional_contents: NutritionalContents;
}

export interface MeasurementEntry {
  id: string;
  type: string;
  value: number;
  unit: string;
  date: string;
  updated_at: string;
}

export interface WaterEntry {
  cups: number;
  milliliters: number;
  date: string;
}

export interface ExerciseEntry {
  id: string;
  name: string;
  calories_burned: number;
  duration_minutes: number;
  date: string;
}

export interface NutrientGoals {
  energy: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  [key: string]: number;
}

export interface SessionInfo {
  userId: string;
  email: string;
  country: string;
  tier: string;
}

export interface MFPResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}
