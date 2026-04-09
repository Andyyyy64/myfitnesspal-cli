import type { AuthConfig, NutrientGoals } from "./types.js";

const BASE_URL = "https://www.myfitnesspal.com";

function makeHeaders(config: AuthConfig): Record<string, string> {
  return {
    Cookie: `__Secure-next-auth.session-token=${config.sessionToken}`,
    Accept: "application/json",
  };
}

export async function getNutrientGoals(
  config: AuthConfig,
  date?: string
): Promise<NutrientGoals> {
  const params = date ? `?date=${date}` : "";
  const res = await fetch(
    `${BASE_URL}/api/services/nutrient-goals${params}`,
    { headers: makeHeaders(config) }
  );
  if (!res.ok) throw new Error(`Failed to get nutrient goals: ${res.status}`);
  const data = await res.json();
  const goals = Array.isArray(data) ? data[0] : data;
  return goals as NutrientGoals;
}
