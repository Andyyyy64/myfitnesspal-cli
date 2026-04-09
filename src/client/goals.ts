import type { AuthConfig, NutrientGoals } from "./types.js";
import { BASE_URL, makeReadHeaders } from "./constants.js";

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
