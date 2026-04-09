import type { AuthConfig, WaterEntry } from "./types.js";

const BASE_URL = "https://www.myfitnesspal.com";

function makeHeaders(config: AuthConfig): Record<string, string> {
  return {
    Cookie: `__Secure-next-auth.session-token=${config.sessionToken}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

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
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to log water: ${res.status} - ${text}`);
  }
  return (await res.json()) as WaterEntry;
}
