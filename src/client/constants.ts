import type { AuthConfig } from "./types.js";

export const BASE_URL = "https://www.myfitnesspal.com";
export const SESSION_COOKIE_NAME = "__Secure-next-auth.session-token";

export function makeHeaders(config: AuthConfig): Record<string, string> {
  return {
    Cookie: `${SESSION_COOKIE_NAME}=${config.sessionToken}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

export function makeReadHeaders(config: AuthConfig): Record<string, string> {
  return {
    Cookie: `${SESSION_COOKIE_NAME}=${config.sessionToken}`,
    Accept: "application/json",
  };
}
