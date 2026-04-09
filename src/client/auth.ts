import type { AuthConfig, SessionInfo } from "./types.js";
import { BASE_URL, SESSION_COOKIE_NAME, makeReadHeaders } from "./constants.js";

export async function getSession(config: AuthConfig): Promise<SessionInfo> {
  const res = await fetch(`${BASE_URL}/api/auth/session`, {
    headers: makeReadHeaders(config),
  });
  if (!res.ok) {
    throw new Error(`Session check failed: ${res.status}`);
  }
  return (await res.json()) as SessionInfo;
}

export async function getCsrfToken(config: AuthConfig): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/auth/csrf`, {
    headers: makeReadHeaders(config),
  });
  if (!res.ok) {
    throw new Error(`CSRF fetch failed: ${res.status}`);
  }
  const data = (await res.json()) as { csrfToken: string };
  return data.csrfToken;
}

export async function loginWithCredentials(
  email: string,
  password: string
): Promise<{ sessionToken: string }> {
  // Step 1: Get CSRF token from a fresh session
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`, {
    headers: { Accept: "application/json" },
  });
  if (!csrfRes.ok) {
    throw new Error(`CSRF fetch failed: ${csrfRes.status}`);
  }
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };
  const csrfCookies = csrfRes.headers.getSetCookie?.() ?? [];

  // Step 2: POST credentials
  const body = new URLSearchParams({
    email,
    password,
    csrfToken,
    callbackUrl: `${BASE_URL}/`,
    json: "true",
  });

  const cookieHeader = csrfCookies
    .map((c) => c.split(";")[0])
    .join("; ");

  const loginRes = await fetch(
    `${BASE_URL}/api/auth/callback/credentials`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: cookieHeader,
      },
      body: body.toString(),
      redirect: "manual",
    }
  );

  // Extract session token from Set-Cookie
  const setCookies = loginRes.headers.getSetCookie?.() ?? [];
  const sessionCookie = setCookies.find((c) =>
    c.startsWith(`${SESSION_COOKIE_NAME}=`)
  );
  if (!sessionCookie) {
    throw new Error(
      "Login failed: no session token received. Check your credentials or try set-cookie."
    );
  }

  const sessionToken = sessionCookie
    .split("=")
    .slice(1)
    .join("=")
    .split(";")[0];

  return { sessionToken };
}
