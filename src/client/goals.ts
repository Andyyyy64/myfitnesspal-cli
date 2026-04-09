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

/**
 * Update nutrient goals.
 *
 * The MFP web frontend updates goals via PATCH /api/services/users (user profile),
 * not via POST /api/services/nutrient-goals. The nutrient-goals POST endpoint exists
 * but requires a specific "OneCycleItem" Java deserialization format that could not
 * be reverse-engineered. All attempted body formats return 422 "json request body
 * malformed".
 *
 * The GET response structure is:
 *   [{valid_from, valid_to, daily_goals: [{day_of_week, group_id, energy:{value,unit}, ...}], default_goal: {...}}]
 *
 * This function currently attempts the POST endpoint and will fail with 422.
 * A future fix should use PATCH /api/services/users with the correct permitted
 * parameters for goal updates.
 */
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
