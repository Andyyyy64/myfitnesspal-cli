import type { AuthConfig, MeasurementEntry } from "./types.js";
import { BASE_URL, makeHeaders } from "./constants.js";

export async function getMeasurements(
  config: AuthConfig
): Promise<MeasurementEntry[]> {
  const res = await fetch(
    `${BASE_URL}/api/user-measurements/measurements`,
    { headers: makeHeaders(config) }
  );
  if (!res.ok) throw new Error(`Failed to get measurements: ${res.status}`);
  const data = await res.json();
  return (data as { items?: MeasurementEntry[] }).items ??
    (data as MeasurementEntry[]);
}

export async function upsertMeasurement(
  config: AuthConfig,
  measurement: { type: string; value: number; unit: string; date: string }
): Promise<MeasurementEntry> {
  const res = await fetch(
    `${BASE_URL}/api/user-measurements/measurements`,
    {
      method: "PUT",
      headers: makeHeaders(config),
      body: JSON.stringify(measurement),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to save measurement: ${res.status} - ${text}`);
  }
  return (await res.json()) as MeasurementEntry;
}

export async function deleteMeasurement(
  config: AuthConfig,
  id: string
): Promise<void> {
  const res = await fetch(
    `${BASE_URL}/api/user-measurements/measurements/${id}`,
    {
      method: "DELETE",
      headers: makeHeaders(config),
    }
  );
  if (!res.ok) throw new Error(`Failed to delete measurement: ${res.status}`);
}
