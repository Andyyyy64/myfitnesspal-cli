import type { AuthConfig, ExerciseEntry } from "./types.js";
import { BASE_URL, makeHeaders, makeReadHeaders } from "./constants.js";

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

export async function lookupExercises(config: AuthConfig): Promise<ExerciseSearchResult[]> {
  const res = await fetch(`${BASE_URL}/api/services/exercises/lookup`, { headers: makeReadHeaders(config) });
  if (!res.ok) throw new Error(`Failed to lookup exercises: ${res.status}`);
  const data = await res.json();
  return (data as { items?: ExerciseSearchResult[] }).items ?? (data as ExerciseSearchResult[]);
}

export async function lookupPrivateExercises(config: AuthConfig): Promise<ExerciseSearchResult[]> {
  const res = await fetch(`${BASE_URL}/api/services/exercises/lookup_private`, { headers: makeReadHeaders(config) });
  if (!res.ok) throw new Error(`Failed to lookup private exercises: ${res.status}`);
  const data = await res.json();
  return (data as { items?: ExerciseSearchResult[] }).items ?? (data as ExerciseSearchResult[]);
}

export async function getCaloriesBurned(config: AuthConfig, exerciseId: string): Promise<unknown> {
  const res = await fetch(`${BASE_URL}/api/services/exercises/calories_burned/${exerciseId}`, { headers: makeReadHeaders(config) });
  if (!res.ok) throw new Error(`Failed to get calories burned: ${res.status}`);
  return await res.json();
}

export async function updateExercise(config: AuthConfig, exerciseId: string, updates: Record<string, unknown>): Promise<ExerciseEntry> {
  const res = await fetch(`${BASE_URL}/api/services/exercises/${exerciseId}`, {
    method: "PUT",
    headers: makeHeaders(config),
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to update exercise: ${res.status} - ${text}`);
  }
  return (await res.json()) as ExerciseEntry;
}
