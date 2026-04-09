import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import type { AuthConfig } from "../client/types.js";

const CONFIG_DIR = join(homedir(), ".config", "mfp-cli");
const AUTH_FILE = join(CONFIG_DIR, "auth.json");

export async function loadAuth(): Promise<AuthConfig | null> {
  try {
    const data = await readFile(AUTH_FILE, "utf-8");
    return JSON.parse(data) as AuthConfig;
  } catch {
    return null;
  }
}

export async function saveAuth(config: AuthConfig): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true });
  await writeFile(AUTH_FILE, JSON.stringify(config, null, 2), { mode: 0o600 });
}

export function getConfigDir(): string {
  return CONFIG_DIR;
}
