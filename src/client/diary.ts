import type { AuthConfig, DiaryEntry } from "./types.js";
import { BASE_URL, makeHeaders, makeReadHeaders } from "./constants.js";

export async function readDiary(
  config: AuthConfig,
  date: string
): Promise<DiaryEntry[]> {
  const res = await fetch(
    `${BASE_URL}/api/services/diary/read_diary?entry_date=${date}&fields=all&types=food_entry`,
    { headers: makeHeaders(config) }
  );
  if (!res.ok) {
    throw new Error(`Failed to read diary: ${res.status}`);
  }
  const data = await res.json();
  return (data as { items?: DiaryEntry[] }).items ?? (data as DiaryEntry[]);
}

export async function createDiaryEntry(
  config: AuthConfig,
  entry: {
    food_id: string;
    food_version?: string;
    serving_size: { nutrition_multiplier: number; unit: string; value: number };
    servings: number;
    meal_position: number;
    date: string;
  }
): Promise<DiaryEntry> {
  const res = await fetch(`${BASE_URL}/api/services/diary`, {
    method: "POST",
    headers: makeHeaders(config),
    body: JSON.stringify({
      items: [{
        type: "food_entry",
        date: entry.date,
        food: {
          id: entry.food_id,
          version: entry.food_version ?? entry.food_id,
        },
        servings: entry.servings,
        meal_position: entry.meal_position,
        serving_size: entry.serving_size,
      }],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create diary entry: ${res.status} - ${text}`);
  }
  const data = await res.json();
  const items = (data as { items?: DiaryEntry[] }).items;
  return items?.[0] ?? (data as DiaryEntry);
}

export async function deleteDiaryEntry(
  config: AuthConfig,
  entryId: string
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/services/diary/${entryId}`, {
    method: "DELETE",
    headers: makeHeaders(config),
  });
  if (!res.ok) {
    throw new Error(`Failed to delete diary entry: ${res.status}`);
  }
}

export async function updateDiaryEntry(
  config: AuthConfig,
  entryId: string,
  updates: { servings?: number; serving_size_id?: string; meal_name?: string }
): Promise<DiaryEntry> {
  const res = await fetch(`${BASE_URL}/api/services/diary/${entryId}`, {
    method: "PATCH",
    headers: makeHeaders(config),
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to update diary entry: ${res.status} - ${text}`);
  }
  return (await res.json()) as DiaryEntry;
}

export async function readDiaryNotes(
  config: AuthConfig,
  date: string,
  noteType = "food"
): Promise<unknown> {
  const res = await fetch(
    `${BASE_URL}/api/services/diary/read_notes?date=${date}&note_type=${noteType}`,
    { headers: makeHeaders(config) }
  );
  if (!res.ok) throw new Error(`Failed to read diary notes: ${res.status}`);
  return await res.json();
}

export async function addDiaryNote(
  config: AuthConfig,
  data: { date: string; note: string; note_type?: string }
): Promise<unknown> {
  const res = await fetch(`${BASE_URL}/api/services/diary/notes/${data.note_type || "food"}`, {
    method: "POST",
    headers: makeHeaders(config),
    body: JSON.stringify({ date: data.date, body: data.note }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to add diary note: ${res.status} - ${text}`);
  }
  return await res.json();
}

export async function copyMeal(
  config: AuthConfig,
  data: { from_date: string; to_date: string; from_meal: string; to_meal: string }
): Promise<unknown> {
  const res = await fetch(`${BASE_URL}/api/services/diary/copy_meal`, {
    method: "POST",
    headers: makeHeaders(config),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to copy meal: ${res.status} - ${text}`);
  }
  return await res.json();
}

export async function completeDiaryDay(
  config: AuthConfig,
  date: string
): Promise<unknown> {
  const res = await fetch(`${BASE_URL}/api/services/diary/day`, {
    method: "POST",
    headers: makeHeaders(config),
    body: JSON.stringify({ date }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to complete diary day: ${res.status} - ${text}`);
  }
  return await res.json();
}

export async function readDiaryDay(config: AuthConfig, date: string): Promise<unknown> {
  const res = await fetch(`${BASE_URL}/api/services/diary/read_day?date=${date}`, { headers: makeHeaders(config) });
  if (!res.ok) throw new Error(`Failed to read diary day: ${res.status}`);
  return await res.json();
}

export async function getDiaryNutrientGoals(config: AuthConfig, date: string): Promise<unknown> {
  const res = await fetch(`${BASE_URL}/api/services/diary/nutrient_goals?date=${date}`, { headers: makeHeaders(config) });
  if (!res.ok) throw new Error(`Failed to get diary nutrient goals: ${res.status}`);
  return await res.json();
}

export async function getDiaryEntry(config: AuthConfig, entryId: string): Promise<DiaryEntry> {
  const res = await fetch(`${BASE_URL}/api/services/diary/${entryId}`, { headers: makeHeaders(config) });
  if (!res.ok) throw new Error(`Failed to get diary entry: ${res.status}`);
  return (await res.json()) as DiaryEntry;
}

export async function generateDiaryReport(config: AuthConfig, data: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`${BASE_URL}/api/services/diary/report`, {
    method: "POST",
    headers: makeHeaders(config),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to generate diary report: ${res.status}`);
  return await res.json();
}
