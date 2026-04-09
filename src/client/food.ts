import type { AuthConfig, FoodItem } from "./types.js";
import { BASE_URL, makeReadHeaders } from "./constants.js";
const BUILD_ID_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function fetchBuildId(): Promise<string> {
  const res = await fetch(BASE_URL);
  const html = await res.text();
  const match = html.match(/"buildId"\s*:\s*"([^"]+)"/);
  if (!match) {
    throw new Error("Failed to extract buildId from MFP homepage");
  }
  return match[1];
}

export async function searchFood(
  config: AuthConfig,
  query: string,
  page = 0,
  perPage = 25
): Promise<{ items: FoodItem[]; total: number; buildId?: string }> {
  // Ensure we have a fresh buildId
  let buildId = config.buildId;
  if (
    !buildId ||
    !config.buildIdUpdatedAt ||
    Date.now() - new Date(config.buildIdUpdatedAt).getTime() > BUILD_ID_MAX_AGE_MS
  ) {
    buildId = await fetchBuildId();
  }

  const params = encodeURIComponent(JSON.stringify([query, page]));
  const url = `${BASE_URL}/_next/data/${buildId}/food/calorie-chart-nutrition-facts.json?params=${params}`;

  const res = await fetch(url, {
    headers: makeReadHeaders(config),
  });

  if (!res.ok) {
    if (res.status === 404) {
      // buildId may be stale, retry with fresh one
      buildId = await fetchBuildId();
      const retryUrl = `${BASE_URL}/_next/data/${buildId}/food/calorie-chart-nutrition-facts.json?params=${params}`;
      const retryRes = await fetch(retryUrl, {
        headers: makeReadHeaders(config),
      });
      if (!retryRes.ok) {
        throw new Error(`Food search failed: ${retryRes.status}`);
      }
      const retryData = await retryRes.json();
      const items = extractFoodItems(retryData);
      return { items: items.slice(0, perPage), total: items.length, buildId };
    }
    throw new Error(`Food search failed: ${res.status}`);
  }

  const data = await res.json();
  const items = extractFoodItems(data);
  return { items: items.slice(0, perPage), total: items.length, buildId };
}

function extractFoodItems(data: Record<string, unknown>): FoodItem[] {
  // Next.js _next/data wraps in pageProps.dehydratedState
  const pageProps = (data as { pageProps?: Record<string, unknown> }).pageProps;
  if (!pageProps) return [];

  const dehydrated = pageProps.dehydratedState as {
    queries?: Array<{ state?: { data?: { items?: FoodItem[] } } }>;
  };
  if (!dehydrated?.queries?.[0]?.state?.data?.items) return [];

  return dehydrated.queries[0].state.data.items;
}
