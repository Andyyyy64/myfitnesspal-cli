import type { AuthConfig } from "./types.js";
import { BASE_URL, makeHeaders, makeReadHeaders } from "./constants.js";

export interface SavedMeal {
  id: string;
  name: string;
  items: Array<{ food_id: string; servings: number; serving_size_id: string }>;
}

export async function getSavedMeals(config: AuthConfig): Promise<SavedMeal[]> {
  const res = await fetch(`${BASE_URL}/api/services/users/meals/mine`, { headers: makeReadHeaders(config) });
  if (!res.ok) throw new Error(`Failed to get saved meals: ${res.status}`);
  const data = await res.json();
  return (data as { items?: SavedMeal[] }).items ?? (data as SavedMeal[]);
}

export async function deleteSavedMeal(config: AuthConfig, mealId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/services/users/meals/delete/${mealId}`, {
    method: "DELETE",
    headers: makeHeaders(config),
  });
  if (!res.ok) throw new Error(`Failed to delete saved meal: ${res.status}`);
}
