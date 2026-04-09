import type { AuthConfig, FoodItem } from "./types.js";
import { BASE_URL, makeHeaders, makeReadHeaders } from "./constants.js";

export async function getFoodById(config: AuthConfig, foodId: string): Promise<FoodItem> {
  const res = await fetch(`${BASE_URL}/api/services/foods/${foodId}`, { headers: makeReadHeaders(config) });
  if (!res.ok) throw new Error(`Failed to get food: ${res.status}`);
  return (await res.json()) as FoodItem;
}

export async function getMyFoods(config: AuthConfig): Promise<FoodItem[]> {
  const res = await fetch(`${BASE_URL}/api/services/users/foods/mine`, { headers: makeReadHeaders(config) });
  if (!res.ok) throw new Error(`Failed to get custom foods: ${res.status}`);
  const data = await res.json();
  return (data as { items?: FoodItem[] }).items ?? (data as FoodItem[]);
}

export async function createCustomFood(config: AuthConfig, food: {
  description: string;
  brand_name?: string;
  serving_sizes: Array<{ unit: string; value: number; nutrition_multiplier: number }>;
  nutritional_contents: Record<string, unknown>;
}): Promise<FoodItem> {
  const res = await fetch(`${BASE_URL}/api/services/foods`, {
    method: "POST",
    headers: makeHeaders(config),
    body: JSON.stringify({ items: [food] }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create custom food: ${res.status} - ${text}`);
  }
  return (await res.json()) as FoodItem;
}

export async function updateCustomFood(config: AuthConfig, foodId: string, updates: Record<string, unknown>): Promise<FoodItem> {
  const res = await fetch(`${BASE_URL}/api/services/foods/${foodId}`, {
    method: "PATCH",
    headers: makeHeaders(config),
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to update custom food: ${res.status} - ${text}`);
  }
  return (await res.json()) as FoodItem;
}

export async function deleteCustomFood(config: AuthConfig, foodId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/services/foods/${foodId}`, {
    method: "DELETE",
    headers: makeHeaders(config),
  });
  if (!res.ok) throw new Error(`Failed to delete custom food: ${res.status}`);
}

export async function getTopFoods(config: AuthConfig, fromDate: string, toDate: string, lists: string[] = ["recent"]): Promise<unknown> {
  const listsParam = lists.map(l => `lists[]=${l}`).join("&");
  const res = await fetch(`${BASE_URL}/api/services/top_foods?from=${fromDate}&to=${toDate}&${listsParam}`, {
    headers: makeReadHeaders(config),
  });
  if (!res.ok) throw new Error(`Failed to get top foods: ${res.status}`);
  return await res.json();
}
