import type { AuthConfig, MeasurementEntry } from "./types.js";
import { BASE_URL, makeHeaders, makeReadHeaders } from "./constants.js";

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
      body: JSON.stringify({ items: [measurement] }),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to save measurement: ${res.status} - ${text}`);
  }
  const data = await res.json();
  return (data as { items?: MeasurementEntry[] }).items?.[0] ?? (data as MeasurementEntry);
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

export async function getMeasurementTypes(config: AuthConfig): Promise<unknown[]> {
  const res = await fetch(`${BASE_URL}/api/user-measurements/measurements/types`, { headers: makeReadHeaders(config) });
  if (!res.ok) throw new Error(`Failed to get measurement types: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : (data as { items?: unknown[] }).items ?? [];
}

export async function createMeasurementType(config: AuthConfig, type: { name: string }): Promise<unknown> {
  const res = await fetch(`${BASE_URL}/api/user-measurements/measurements/types`, {
    method: "POST",
    headers: makeHeaders(config),
    body: JSON.stringify(type),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create measurement type: ${res.status} - ${text}`);
  }
  return await res.json();
}

export async function deleteMeasurementType(config: AuthConfig, typeId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/user-measurements/measurements/types/${typeId}`, {
    method: "DELETE",
    headers: makeHeaders(config),
  });
  if (!res.ok) throw new Error(`Failed to delete measurement type: ${res.status}`);
}

export async function getMeasurementById(config: AuthConfig, id: string): Promise<MeasurementEntry> {
  const res = await fetch(`${BASE_URL}/api/user-measurements/measurements/${id}`, { headers: makeReadHeaders(config) });
  if (!res.ok) throw new Error(`Failed to get measurement: ${res.status}`);
  const data = await res.json();
  return (data as { item: MeasurementEntry }).item ?? (data as MeasurementEntry);
}
