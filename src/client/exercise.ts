import type { AuthConfig, ExerciseEntry } from "./types.js";

const BASE_URL = "https://www.myfitnesspal.com";

function makeHeaders(config: AuthConfig): Record<string, string> {
  return {
    Cookie: `__Secure-next-auth.session-token=${config.sessionToken}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

export interface ExerciseSearchResult {
  id: string;
  description: string;
  calories_per_minute?: number;
  type: string;
}

export async function searchExercises(
  config: AuthConfig,
  query: string
): Promise<ExerciseSearchResult[]> {
  const res = await fetch(
    `${BASE_URL}/api/services/exercises/search?search=${encodeURIComponent(query)}`,
    { headers: makeHeaders(config) }
  );
  if (!res.ok) throw new Error(`Exercise search failed: ${res.status}`);
  const data = await res.json();
  return (data as { items?: ExerciseSearchResult[] }).items ??
    (data as ExerciseSearchResult[]);
}

export async function logExercise(
  config: AuthConfig,
  exercise: {
    exercise_id: string;
    duration_minutes: number;
    calories_burned?: number;
    date: string;
  }
): Promise<ExerciseEntry> {
  const res = await fetch(`${BASE_URL}/api/services/exercises`, {
    method: "POST",
    headers: makeHeaders(config),
    body: JSON.stringify(exercise),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to log exercise: ${res.status} - ${text}`);
  }
  return (await res.json()) as ExerciseEntry;
}

export async function deleteExercise(
  config: AuthConfig,
  id: string
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/services/exercises/${id}`, {
    method: "DELETE",
    headers: makeHeaders(config),
  });
  if (!res.ok) throw new Error(`Failed to delete exercise: ${res.status}`);
}
