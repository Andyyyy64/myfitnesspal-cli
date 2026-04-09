import type { AuthConfig } from "./types.js";
import { BASE_URL, makeHeaders, makeReadHeaders } from "./constants.js";

export async function getDiarySettings(config: AuthConfig): Promise<unknown> {
  const res = await fetch(`${BASE_URL}/api/services/account/diary_settings`, { headers: makeReadHeaders(config) });
  if (!res.ok) throw new Error(`Failed to get diary settings: ${res.status}`);
  return await res.json();
}

export async function updateDiarySettings(config: AuthConfig, settings: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`${BASE_URL}/api/services/account/diary_settings`, {
    method: "POST",
    headers: makeHeaders(config),
    body: JSON.stringify(settings),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to update diary settings: ${res.status} - ${text}`);
  }
  return await res.json();
}

export async function getUserProfile(config: AuthConfig): Promise<unknown> {
  const res = await fetch(`${BASE_URL}/api/services/users`, { headers: makeReadHeaders(config) });
  if (!res.ok) throw new Error(`Failed to get user profile: ${res.status}`);
  return await res.json();
}

export async function updateUserProfile(config: AuthConfig, updates: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`${BASE_URL}/api/services/users`, {
    method: "PATCH",
    headers: makeHeaders(config),
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to update user profile: ${res.status} - ${text}`);
  }
  return await res.json();
}

export async function requestDataExport(config: AuthConfig): Promise<unknown> {
  const res = await fetch(`${BASE_URL}/api/services/data-exports`, {
    method: "POST",
    headers: makeHeaders(config),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to request data export: ${res.status} - ${text}`);
  }
  return await res.json();
}

export async function getWeeklyDigest(config: AuthConfig, fromDate: string, toDate: string): Promise<unknown> {
  const res = await fetch(
    `${BASE_URL}/api/services/live-digest?from-date=${fromDate}&to-date=${toDate}`,
    { headers: makeReadHeaders(config) }
  );
  if (!res.ok) throw new Error(`Failed to get weekly digest: ${res.status}`);
  return await res.json();
}
