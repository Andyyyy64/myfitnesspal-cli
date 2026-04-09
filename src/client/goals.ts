import type { AuthConfig, NutrientGoals } from "./types.js";
import { BASE_URL, makeHeaders, makeReadHeaders } from "./constants.js";

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

export async function updateNutrientGoals(config: AuthConfig, goals: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`${BASE_URL}/api/services/nutrient-goals`, {
    method: "POST",
    headers: makeHeaders(config),
    body: JSON.stringify(goals),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to update nutrient goals: ${res.status} - ${text}`);
  }
  return await res.json();
}
