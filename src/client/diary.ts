import type { AuthConfig, DiaryEntry } from "./types.js";

const BASE_URL = "https://www.myfitnesspal.com";

function makeHeaders(config: AuthConfig): Record<string, string> {
  return {
    Cookie: `__Secure-next-auth.session-token=${config.sessionToken}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

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
