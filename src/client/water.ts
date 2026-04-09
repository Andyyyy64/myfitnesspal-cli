import type { AuthConfig, WaterEntry } from "./types.js";
import { BASE_URL, makeHeaders } from "./constants.js";

export async function readWater(
  config: AuthConfig,
  date: string
): Promise<WaterEntry> {
  const res = await fetch(
    `${BASE_URL}/api/services/diary/read_water?date=${date}`,
    { headers: makeHeaders(config) }
  );
  if (!res.ok) throw new Error(`Failed to read water: ${res.status}`);
  return (await res.json()) as WaterEntry;
}

export async function logWater(
  config: AuthConfig,
  data: { cups: number; date: string }
): Promise<WaterEntry> {
  const res = await fetch(`${BASE_URL}/api/services/diary/water`, {
    method: "POST",
    headers: makeHeaders(config),
    body: JSON.stringify({ units: "cups", value: data.cups, date: data.date }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to log water: ${res.status} - ${text}`);
  }
  return (await res.json()) as WaterEntry;
}
