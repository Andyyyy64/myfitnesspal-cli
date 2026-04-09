import type { AuthConfig, DiaryEntry } from "./types.js";
import { BASE_URL, makeHeaders } from "./constants.js";

export async function readDiary(
  config: AuthConfig,
  date: string
): Promise<DiaryEntry[]> {
  const res = await fetch(
    `${BASE_URL}/api/services/diary/read_diary?date=${date}`,
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
    serving_size_id: string;
    servings: number;
    meal_name: string;
    entry_date: string;
  }
): Promise<DiaryEntry> {
  const res = await fetch(`${BASE_URL}/api/services/diary`, {
    method: "POST",
    headers: makeHeaders(config),
    body: JSON.stringify(entry),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create diary entry: ${res.status} - ${text}`);
  }
  return (await res.json()) as DiaryEntry;
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
