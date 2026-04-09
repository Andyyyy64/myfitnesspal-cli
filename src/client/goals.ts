import type { AuthConfig, NutrientGoals } from "./types.js";
import { BASE_URL, makeHeaders, makeReadHeaders, SESSION_COOKIE_NAME } from "./constants.js";

export async function getNutrientGoals(
  config: AuthConfig,
  date?: string
): Promise<NutrientGoals> {
  const params = date ? `?date=${date}` : "";
  const res = await fetch(
    `${BASE_URL}/api/services/nutrient-goals${params}`,
    { headers: makeReadHeaders(config) }
  );
  if (!res.ok) throw new Error(`Failed to get nutrient goals: ${res.status}`);
  const data = await res.json();
  const goals = Array.isArray(data) ? data[0] : data;
  return goals as NutrientGoals;
}

const DAYS_OF_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export async function updateNutrientGoals(
  config: AuthConfig,
  updates: { calories?: number; protein?: number; carbs?: number; fat?: number }
): Promise<unknown> {
  // First fetch current goals to get the full structure
  const current = await getNutrientGoals(config);
  const currentDefault = (current as Record<string, unknown>).default_goal as Record<string, unknown> | undefined;

  // Build the goal object with updates applied
  const baseGoal = currentDefault ?? {};
  const newGoal: Record<string, unknown> = {
    ...baseGoal,
    assign_exercise_energy: (baseGoal as Record<string, unknown>).assign_exercise_energy ?? "nutrient_goal",
    exercise_carbohydrates_percentage: (baseGoal as Record<string, unknown>).exercise_carbohydrates_percentage ?? 50,
    exercise_fat_percentage: (baseGoal as Record<string, unknown>).exercise_fat_percentage ?? 30,
    exercise_protein_percentage: (baseGoal as Record<string, unknown>).exercise_protein_percentage ?? 20,
    exercise_saturated_fat_percentage: (baseGoal as Record<string, unknown>).exercise_saturated_fat_percentage ?? 10,
    exercise_sugar_percentage: (baseGoal as Record<string, unknown>).exercise_sugar_percentage ?? 15,
  };

  if (updates.calories !== undefined) {
    newGoal.energy = { value: String(updates.calories), unit: "calories" };
  }
  if (updates.protein !== undefined) newGoal.protein = updates.protein;
  if (updates.carbs !== undefined) newGoal.carbohydrates = updates.carbs;
  if (updates.fat !== undefined) newGoal.fat = updates.fat;

  // Build daily_goals array (same goal for all 7 days)
  const dailyGoals = DAYS_OF_WEEK.map((day, i) => ({
    ...newGoal,
    day_of_week: day,
    group_id: 0,
  }));

  // Get CSRF token from next-auth
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`, {
    headers: { Cookie: `${SESSION_COOKIE_NAME}=${config.sessionToken}`, Accept: "application/json" },
  });
  const csrfData = (await csrfRes.json()) as { csrfToken?: string };
  const csrfToken = csrfData.csrfToken;

  // Also need the csrf cookie for the token to be accepted
  const csrfCookies = csrfRes.headers.getSetCookie?.() ?? [];
  const allCookies = [
    `${SESSION_COOKIE_NAME}=${config.sessionToken}`,
    ...csrfCookies.map((c) => c.split(";")[0]),
  ].join("; ");

  const headers: Record<string, string> = {
    Cookie: allCookies,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (csrfToken) {
    headers["x-csrf-token"] = csrfToken;
  }

  const body = {
    item: {
      valid_from: new Date().toISOString().split("T")[0],
      daily_goals: dailyGoals,
      default_goal: newGoal,
    },
  };

  const res = await fetch(`${BASE_URL}/api/services/nutrient-goals`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to update nutrient goals: ${res.status} - ${text}`);
  }
  return await res.json();
}
