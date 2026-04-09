# MyFitnessPal CLI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a CLI tool that wraps MyFitnessPal's internal web API, enabling food logging, diary viewing, weight tracking, exercise, water, and goal management from the terminal.

**Architecture:** Core SDK layer (`src/client/`) handles all MFP API communication with typed responses. CLI layer (`src/commands/`) uses `commander` to wire commands to SDK methods and format output. Config stored in `~/.config/mfp-cli/auth.json`.

**Tech Stack:** TypeScript, Node.js 18+, commander, cli-table3, inquirer, built-in fetch

---

## File Structure

| File | Responsibility |
|------|---------------|
| `package.json` | Dependencies, bin entry, scripts |
| `tsconfig.json` | TypeScript config (ESM, strict) |
| `src/index.ts` | CLI entrypoint, registers all commands |
| `src/client/types.ts` | All shared TypeScript types/interfaces |
| `src/client/index.ts` | `MFPClient` class — facade over all API modules |
| `src/client/auth.ts` | Login, CSRF, session validation |
| `src/client/food.ts` | Food search, buildId fetching |
| `src/client/diary.ts` | Diary CRUD (read, create, delete entries) |
| `src/client/measurement.ts` | Weight/measurement CRUD |
| `src/client/water.ts` | Water intake read/write |
| `src/client/exercise.ts` | Exercise search, log, delete |
| `src/client/goals.ts` | Nutrient goals read |
| `src/utils/config.ts` | Read/write `~/.config/mfp-cli/auth.json` |
| `src/utils/output.ts` | Table vs JSON output formatting |
| `src/commands/auth.ts` | `mfp login`, `mfp auth set-cookie`, `mfp auth status` |
| `src/commands/search.ts` | `mfp search <query>` |
| `src/commands/log.ts` | `mfp log <food> [amount]` |
| `src/commands/diary.ts` | `mfp diary [date]`, `mfp diary delete <id>` |
| `src/commands/weight.ts` | `mfp weight [value]` |
| `src/commands/water.ts` | `mfp water [cups]` |
| `src/commands/exercise.ts` | `mfp exercise search`, `mfp exercise log` |
| `src/commands/goals.ts` | `mfp goals` |

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `src/index.ts`

- [ ] **Step 1: Initialize package.json**

```json
{
  "name": "myfitnesspal-cli",
  "version": "0.1.0",
  "description": "CLI for MyFitnessPal - reverse-engineered internal API",
  "type": "module",
  "bin": {
    "mfp": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/index.ts",
    "start": "node dist/index.js"
  },
  "keywords": ["myfitnesspal", "cli", "diet", "nutrition", "fitness"],
  "license": "MIT",
  "engines": {
    "node": ">=18.0.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Create .gitignore**

```
node_modules/
dist/
*.js
*.d.ts
*.js.map
!src/**
```

- [ ] **Step 4: Install dependencies**

Run: `npm install commander cli-table3 inquirer`
Run: `npm install -D typescript tsx @types/node @types/inquirer`

- [ ] **Step 5: Create minimal CLI entrypoint**

`src/index.ts`:
```typescript
#!/usr/bin/env node
import { Command } from "commander";

const program = new Command();

program
  .name("mfp")
  .description("CLI for MyFitnessPal")
  .version("0.1.0");

program.parse();
```

- [ ] **Step 6: Verify CLI runs**

Run: `npx tsx src/index.ts --help`
Expected: Shows "CLI for MyFitnessPal" help text with version 0.1.0

- [ ] **Step 7: Commit**

```bash
git add package.json tsconfig.json .gitignore src/index.ts package-lock.json
git commit -m "feat: scaffold project with TypeScript, commander, CLI entrypoint"
```

---

### Task 2: Types and Config Utilities

**Files:**
- Create: `src/client/types.ts`
- Create: `src/utils/config.ts`
- Create: `src/utils/output.ts`

- [ ] **Step 1: Create shared types**

`src/client/types.ts`:
```typescript
export interface AuthConfig {
  sessionToken: string;
  buildId?: string;
  buildIdUpdatedAt?: string;
  userId?: string;
}

export interface NutritionalContents {
  energy?: { value: number; unit: string };
  protein?: number;
  carbohydrates?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  [key: string]: unknown;
}

export interface ServingSize {
  id: string;
  unit: string;
  value: number;
  nutrition_multiplier: number;
}

export interface FoodItem {
  id: string;
  description: string;
  brand?: string;
  type: string;
  verified: boolean;
  nutritional_contents: NutritionalContents;
  serving_sizes: ServingSize[];
}

export interface DiaryEntry {
  id: string;
  food: FoodItem;
  serving_size: ServingSize;
  servings: number;
  meal_name: string;
  entry_date: string;
  nutritional_contents: NutritionalContents;
}

export interface MeasurementEntry {
  id: string;
  type: string;
  value: number;
  unit: string;
  date: string;
  updated_at: string;
}

export interface WaterEntry {
  cups: number;
  milliliters: number;
  date: string;
}

export interface ExerciseEntry {
  id: string;
  name: string;
  calories_burned: number;
  duration_minutes: number;
  date: string;
}

export interface NutrientGoals {
  energy: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  [key: string]: number;
}

export interface SessionInfo {
  userId: string;
  email: string;
  country: string;
  tier: string;
}

export interface MFPResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}
```

- [ ] **Step 2: Create config utility**

`src/utils/config.ts`:
```typescript
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
  await writeFile(AUTH_FILE, JSON.stringify(config, null, 2));
}

export function getConfigDir(): string {
  return CONFIG_DIR;
}
```

- [ ] **Step 3: Create output utility**

`src/utils/output.ts`:
```typescript
import Table from "cli-table3";

export function outputResult<T>(data: T, jsonMode: boolean, tableFormatter?: (data: T) => void): void {
  if (jsonMode) {
    console.log(JSON.stringify({ success: true, data }, null, 2));
  } else if (tableFormatter) {
    tableFormatter(data);
  } else {
    console.log(data);
  }
}

export function outputError(message: string, jsonMode: boolean): void {
  if (jsonMode) {
    console.error(JSON.stringify({ success: false, error: message }));
  } else {
    console.error(`Error: ${message}`);
  }
  process.exit(1);
}

export function createTable(head: string[], colWidths?: number[]): Table.Table {
  return new Table({ head, colWidths, style: { head: ["cyan"] } });
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/client/types.ts src/utils/config.ts src/utils/output.ts
git commit -m "feat: add shared types, config manager, output utilities"
```

---

### Task 3: Auth Client + CLI Commands

**Files:**
- Create: `src/client/auth.ts`
- Create: `src/client/index.ts`
- Create: `src/commands/auth.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Create auth client**

`src/client/auth.ts`:
```typescript
import type { AuthConfig, SessionInfo } from "./types.js";

const BASE_URL = "https://www.myfitnesspal.com";

export async function getSession(config: AuthConfig): Promise<SessionInfo> {
  const res = await fetch(`${BASE_URL}/api/auth/session`, {
    headers: {
      Cookie: `__Secure-next-auth.session-token=${config.sessionToken}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`Session check failed: ${res.status}`);
  }
  return (await res.json()) as SessionInfo;
}

export async function getCsrfToken(config: AuthConfig): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/auth/csrf`, {
    headers: {
      Cookie: `__Secure-next-auth.session-token=${config.sessionToken}`,
      Accept: "application/json",
    },
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
    c.startsWith("__Secure-next-auth.session-token=")
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
```

- [ ] **Step 2: Create MFPClient facade**

`src/client/index.ts`:
```typescript
import type { AuthConfig, SessionInfo } from "./types.js";
import { getSession, getCsrfToken, loginWithCredentials } from "./auth.js";

export class MFPClient {
  constructor(private config: AuthConfig) {}

  get sessionToken(): string {
    return this.config.sessionToken;
  }

  get cookieHeader(): string {
    return `__Secure-next-auth.session-token=${this.config.sessionToken}`;
  }

  async getSession(): Promise<SessionInfo> {
    return getSession(this.config);
  }

  async getCsrfToken(): Promise<string> {
    return getCsrfToken(this.config);
  }

  static async login(
    email: string,
    password: string
  ): Promise<{ sessionToken: string }> {
    return loginWithCredentials(email, password);
  }
}

export { MFPClient as default };
```

- [ ] **Step 3: Create auth CLI commands**

`src/commands/auth.ts`:
```typescript
import { Command } from "commander";
import inquirer from "inquirer";
import { MFPClient } from "../client/index.js";
import { loadAuth, saveAuth } from "../utils/config.js";
import { outputResult, outputError } from "../utils/output.js";

export function registerAuthCommands(program: Command): void {
  program
    .command("login")
    .description("Login with email and password")
    .option("--email <email>", "MyFitnessPal email")
    .option("--password <password>", "MyFitnessPal password")
    .option("--json", "Output as JSON")
    .action(async (opts) => {
      try {
        let { email, password } = opts;
        if (!email || !password) {
          const answers = await inquirer.prompt([
            ...(!email
              ? [{ type: "input", name: "email", message: "Email:" }]
              : []),
            ...(!password
              ? [{ type: "password", name: "password", message: "Password:" }]
              : []),
          ]);
          email = email || answers.email;
          password = password || answers.password;
        }

        const { sessionToken } = await MFPClient.login(email, password);
        const config = { sessionToken };
        await saveAuth(config);

        // Verify and get user info
        const client = new MFPClient(config);
        const session = await client.getSession();
        await saveAuth({ ...config, userId: session.userId });

        outputResult(
          { message: "Login successful", userId: session.userId, email: session.email },
          opts.json
        );
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });

  const auth = program
    .command("auth")
    .description("Authentication management");

  auth
    .command("set-cookie <token>")
    .description("Manually set session cookie")
    .option("--json", "Output as JSON")
    .action(async (token: string, opts) => {
      try {
        const config = { sessionToken: token };
        await saveAuth(config);

        // Verify the token
        const client = new MFPClient(config);
        const session = await client.getSession();
        await saveAuth({ ...config, userId: session.userId });

        outputResult(
          { message: "Cookie saved and verified", userId: session.userId },
          opts.json
        );
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });

  auth
    .command("status")
    .description("Check authentication status")
    .option("--json", "Output as JSON")
    .action(async (opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in. Run `mfp login` or `mfp auth set-cookie`.", opts.json);
          return;
        }
        const client = new MFPClient(config);
        const session = await client.getSession();
        outputResult(session, opts.json, (s) => {
          console.log(`Logged in as: ${s.email}`);
          console.log(`User ID: ${s.userId}`);
          console.log(`Tier: ${s.tier}`);
          console.log(`Country: ${s.country}`);
        });
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });
}
```

- [ ] **Step 4: Wire auth commands into main CLI**

Replace `src/index.ts`:
```typescript
#!/usr/bin/env node
import { Command } from "commander";
import { registerAuthCommands } from "./commands/auth.js";

const program = new Command();

program
  .name("mfp")
  .description("CLI for MyFitnessPal")
  .version("0.1.0");

registerAuthCommands(program);

program.parse();
```

- [ ] **Step 5: Test auth set-cookie manually**

Run: `npx tsx src/index.ts auth set-cookie "eyJhbGci..." --json`
Expected: JSON output with `success: true`, userId

Run: `npx tsx src/index.ts auth status`
Expected: Shows logged-in user email and ID

- [ ] **Step 6: Commit**

```bash
git add src/client/auth.ts src/client/index.ts src/commands/auth.ts src/index.ts
git commit -m "feat: add auth commands (login, set-cookie, status)"
```

---

### Task 4: Food Search Client + Command

**Files:**
- Create: `src/client/food.ts`
- Create: `src/commands/search.ts`
- Modify: `src/client/index.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Create food client**

`src/client/food.ts`:
```typescript
import type { AuthConfig, FoodItem } from "./types.js";

const BASE_URL = "https://www.myfitnesspal.com";
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
): Promise<{ items: FoodItem[]; total: number }> {
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
    headers: {
      Cookie: `__Secure-next-auth.session-token=${config.sessionToken}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    if (res.status === 404) {
      // buildId may be stale, retry with fresh one
      buildId = await fetchBuildId();
      const retryUrl = `${BASE_URL}/_next/data/${buildId}/food/calorie-chart-nutrition-facts.json?params=${params}`;
      const retryRes = await fetch(retryUrl, {
        headers: {
          Cookie: `__Secure-next-auth.session-token=${config.sessionToken}`,
          Accept: "application/json",
        },
      });
      if (!retryRes.ok) {
        throw new Error(`Food search failed: ${retryRes.status}`);
      }
      const retryData = await retryRes.json();
      const items = extractFoodItems(retryData);
      return { items: items.slice(0, perPage), total: items.length };
    }
    throw new Error(`Food search failed: ${res.status}`);
  }

  const data = await res.json();
  const items = extractFoodItems(data);
  return { items: items.slice(0, perPage), total: items.length, buildId } as {
    items: FoodItem[];
    total: number;
    buildId?: string;
  };
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
```

- [ ] **Step 2: Add food search to MFPClient**

Add to `src/client/index.ts`:
```typescript
import { searchFood, fetchBuildId } from "./food.js";
import { saveAuth } from "../utils/config.js";

// Add these methods to the MFPClient class:

  async searchFood(
    query: string,
    page = 0,
    perPage = 25
  ): Promise<{ items: FoodItem[]; total: number }> {
    const result = await searchFood(this.config, query, page, perPage);
    // Cache the buildId if it was refreshed
    if ((result as { buildId?: string }).buildId) {
      this.config.buildId = (result as { buildId?: string }).buildId;
      this.config.buildIdUpdatedAt = new Date().toISOString();
      await saveAuth(this.config);
    }
    return result;
  }
```

Import `FoodItem` from types and `saveAuth` from utils/config at the top.

- [ ] **Step 3: Create search command**

`src/commands/search.ts`:
```typescript
import { Command } from "commander";
import { MFPClient } from "../client/index.js";
import { loadAuth } from "../utils/config.js";
import { outputResult, outputError, createTable } from "../utils/output.js";
import type { FoodItem } from "../client/types.js";

export function registerSearchCommand(program: Command): void {
  program
    .command("search <query>")
    .description("Search for foods")
    .option("--page <n>", "Page number", "0")
    .option("--per-page <n>", "Results per page", "10")
    .option("--json", "Output as JSON")
    .action(async (query: string, opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in. Run `mfp login` first.", opts.json);
          return;
        }

        const client = new MFPClient(config);
        const result = await client.searchFood(
          query,
          parseInt(opts.page),
          parseInt(opts.perPage)
        );

        outputResult(result, opts.json, ({ items }) => {
          if (items.length === 0) {
            console.log("No results found.");
            return;
          }
          const table = createTable(["#", "ID", "Name", "Brand", "Cal", "P", "C", "F"]);
          items.forEach((item: FoodItem, i: number) => {
            const nc = item.nutritional_contents;
            table.push([
              i + 1,
              item.id,
              item.description.substring(0, 30),
              (item.brand || "-").substring(0, 15),
              nc.energy?.value ?? "-",
              nc.protein ?? "-",
              nc.carbohydrates ?? "-",
              nc.fat ?? "-",
            ]);
          });
          console.log(table.toString());
        });
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });
}
```

- [ ] **Step 4: Register search command in main CLI**

Add to `src/index.ts`:
```typescript
import { registerSearchCommand } from "./commands/search.js";
// After registerAuthCommands(program):
registerSearchCommand(program);
```

- [ ] **Step 5: Test food search**

Run: `npx tsx src/index.ts search "chicken breast" --json`
Expected: JSON with food items containing id, description, nutritional_contents

Run: `npx tsx src/index.ts search "おにぎり"`
Expected: Table showing food results with calories, protein, carbs, fat

- [ ] **Step 6: Commit**

```bash
git add src/client/food.ts src/commands/search.ts src/client/index.ts src/index.ts
git commit -m "feat: add food search command"
```

---

### Task 5: Diary Client + Commands

**Files:**
- Create: `src/client/diary.ts`
- Create: `src/commands/diary.ts`
- Create: `src/commands/log.ts`
- Modify: `src/client/index.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Create diary client**

`src/client/diary.ts`:
```typescript
import type { AuthConfig, DiaryEntry } from "./types.js";

const BASE_URL = "https://www.myfitnesspal.com";

function makeHeaders(config: AuthConfig): Record<string, string> {
  return {
    Cookie: `__Secure-next-auth.session-token=${config.sessionToken}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

export async function readDiary(
  config: AuthConfig,
  date: string
): Promise<DiaryEntry[]> {
  const res = await fetch(
    `${BASE_URL}/api/services/diary/read_diary?date=${date}`,
    { headers: makeHeaders(config) }
  );
  if (!res.ok) {
    throw new Error(`Failed to read diary: ${res.status}`);
  }
  const data = await res.json();
  return (data as { items?: DiaryEntry[] }).items ?? (data as DiaryEntry[]);
}

export async function createDiaryEntry(
  config: AuthConfig,
  entry: {
    food_id: string;
    serving_size_id: string;
    servings: number;
    meal_name: string;
    entry_date: string;
  }
): Promise<DiaryEntry> {
  const res = await fetch(`${BASE_URL}/api/services/diary`, {
    method: "POST",
    headers: makeHeaders(config),
    body: JSON.stringify(entry),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create diary entry: ${res.status} - ${text}`);
  }
  return (await res.json()) as DiaryEntry;
}

export async function deleteDiaryEntry(
  config: AuthConfig,
  entryId: string
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/services/diary/${entryId}`, {
    method: "DELETE",
    headers: makeHeaders(config),
  });
  if (!res.ok) {
    throw new Error(`Failed to delete diary entry: ${res.status}`);
  }
}
```

- [ ] **Step 2: Add diary methods to MFPClient**

Add to `src/client/index.ts`:
```typescript
import { readDiary, createDiaryEntry, deleteDiaryEntry } from "./diary.js";
import type { DiaryEntry } from "./types.js";

// Add to MFPClient class:

  async readDiary(date: string): Promise<DiaryEntry[]> {
    return readDiary(this.config, date);
  }

  async createDiaryEntry(entry: {
    food_id: string;
    serving_size_id: string;
    servings: number;
    meal_name: string;
    entry_date: string;
  }): Promise<DiaryEntry> {
    return createDiaryEntry(this.config, entry);
  }

  async deleteDiaryEntry(entryId: string): Promise<void> {
    return deleteDiaryEntry(this.config, entryId);
  }
```

- [ ] **Step 3: Create diary command**

`src/commands/diary.ts`:
```typescript
import { Command } from "commander";
import { MFPClient } from "../client/index.js";
import { loadAuth } from "../utils/config.js";
import { outputResult, outputError, createTable } from "../utils/output.js";
import type { DiaryEntry } from "../client/types.js";

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export function registerDiaryCommand(program: Command): void {
  const diary = program
    .command("diary [date]")
    .description("View food diary (default: today)")
    .option("--json", "Output as JSON")
    .action(async (date: string | undefined, opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in. Run `mfp login` first.", opts.json);
          return;
        }

        const client = new MFPClient(config);
        const entries = await client.readDiary(date || todayStr());

        outputResult(entries, opts.json, (entries: DiaryEntry[]) => {
          if (entries.length === 0) {
            console.log("No entries for this date.");
            return;
          }

          // Group by meal
          const meals = new Map<string, DiaryEntry[]>();
          for (const entry of entries) {
            const meal = entry.meal_name || "Other";
            if (!meals.has(meal)) meals.set(meal, []);
            meals.get(meal)!.push(entry);
          }

          for (const [meal, mealEntries] of meals) {
            console.log(`\n--- ${meal} ---`);
            const table = createTable(["ID", "Food", "Servings", "Cal", "P", "C", "F"]);
            for (const e of mealEntries) {
              const nc = e.nutritional_contents;
              table.push([
                e.id,
                (e.food?.description || "Unknown").substring(0, 25),
                e.servings,
                nc?.energy?.value ?? "-",
                nc?.protein ?? "-",
                nc?.carbohydrates ?? "-",
                nc?.fat ?? "-",
              ]);
            }
            console.log(table.toString());
          }

          // Totals
          let totalCal = 0, totalP = 0, totalC = 0, totalF = 0;
          for (const e of entries) {
            const nc = e.nutritional_contents;
            totalCal += nc?.energy?.value ?? 0;
            totalP += nc?.protein ?? 0;
            totalC += nc?.carbohydrates ?? 0;
            totalF += nc?.fat ?? 0;
          }
          console.log(`\nTotal: ${totalCal} cal | P: ${totalP}g | C: ${totalC}g | F: ${totalF}g`);
        });
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });

  diary
    .command("delete <id>")
    .description("Delete a diary entry")
    .option("--json", "Output as JSON")
    .action(async (id: string, opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in.", opts.json);
          return;
        }
        const client = new MFPClient(config);
        await client.deleteDiaryEntry(id);
        outputResult({ message: "Entry deleted", id }, opts.json, () => {
          console.log(`Deleted entry ${id}`);
        });
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });
}
```

- [ ] **Step 4: Create log command**

`src/commands/log.ts`:
```typescript
import { Command } from "commander";
import inquirer from "inquirer";
import { MFPClient } from "../client/index.js";
import { loadAuth } from "../utils/config.js";
import { outputResult, outputError } from "../utils/output.js";
import type { FoodItem } from "../client/types.js";

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export function registerLogCommand(program: Command): void {
  program
    .command("log <food> [amount]")
    .description("Log a food entry")
    .option("--meal <meal>", "Meal: breakfast, lunch, dinner, snack", "lunch")
    .option("--date <date>", "Date (YYYY-MM-DD)", todayStr())
    .option("--serving-size <id>", "Serving size ID (skip interactive)")
    .option("--servings <n>", "Number of servings", "1")
    .option("--json", "Output as JSON")
    .action(async (food: string, amount: string | undefined, opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in.", opts.json);
          return;
        }

        const client = new MFPClient(config);

        // If serving-size is provided, treat food as a food ID (programmatic mode)
        if (opts.servingSize) {
          const entry = await client.createDiaryEntry({
            food_id: food,
            serving_size_id: opts.servingSize,
            servings: parseFloat(opts.servings),
            meal_name: opts.meal,
            entry_date: opts.date,
          });
          outputResult(entry, opts.json, () => {
            console.log(`Logged: ${food} (${opts.servings} servings) to ${opts.meal}`);
          });
          return;
        }

        // Interactive mode: search for food
        const result = await client.searchFood(food, 0, 10);
        if (result.items.length === 0) {
          outputError(`No foods found for "${food}"`, opts.json);
          return;
        }

        const { selectedIndex } = await inquirer.prompt([
          {
            type: "list",
            name: "selectedIndex",
            message: "Select a food:",
            choices: result.items.map((item: FoodItem, i: number) => ({
              name: `${item.description} (${item.brand || "generic"}) - ${item.nutritional_contents.energy?.value ?? "?"}cal`,
              value: i,
            })),
          },
        ]);

        const selectedFood = result.items[selectedIndex];

        // Select serving size
        const { servingSizeIndex } = await inquirer.prompt([
          {
            type: "list",
            name: "servingSizeIndex",
            message: "Serving size:",
            choices: selectedFood.serving_sizes.map((ss, i) => ({
              name: `${ss.value} ${ss.unit}`,
              value: i,
            })),
          },
        ]);

        const selectedServing = selectedFood.serving_sizes[servingSizeIndex];

        // Number of servings
        let servings = parseFloat(opts.servings);
        if (amount) {
          // Try to parse amount as number of servings
          servings = parseFloat(amount) || 1;
        }

        const entry = await client.createDiaryEntry({
          food_id: selectedFood.id,
          serving_size_id: selectedServing.id,
          servings,
          meal_name: opts.meal,
          entry_date: opts.date,
        });

        outputResult(entry, opts.json, () => {
          const cal = selectedFood.nutritional_contents.energy?.value ?? 0;
          console.log(
            `Logged: ${selectedFood.description} x${servings} to ${opts.meal} (${Math.round(cal * selectedServing.nutrition_multiplier * servings)} cal)`
          );
        });
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });
}
```

- [ ] **Step 5: Register diary and log commands**

Add to `src/index.ts`:
```typescript
import { registerDiaryCommand } from "./commands/diary.js";
import { registerLogCommand } from "./commands/log.js";
// After existing registrations:
registerDiaryCommand(program);
registerLogCommand(program);
```

- [ ] **Step 6: Test diary and log**

Run: `npx tsx src/index.ts diary --json`
Expected: JSON array of today's diary entries

Run: `npx tsx src/index.ts diary 2026-04-09`
Expected: Table grouped by meal with totals

- [ ] **Step 7: Commit**

```bash
git add src/client/diary.ts src/commands/diary.ts src/commands/log.ts src/client/index.ts src/index.ts
git commit -m "feat: add diary view, food logging, and entry deletion"
```

---

### Task 6: Measurement (Weight) Client + Command

**Files:**
- Create: `src/client/measurement.ts`
- Create: `src/commands/weight.ts`
- Modify: `src/client/index.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Create measurement client**

`src/client/measurement.ts`:
```typescript
import type { AuthConfig, MeasurementEntry } from "./types.js";

const BASE_URL = "https://www.myfitnesspal.com";

function makeHeaders(config: AuthConfig): Record<string, string> {
  return {
    Cookie: `__Secure-next-auth.session-token=${config.sessionToken}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

export async function getMeasurements(
  config: AuthConfig
): Promise<MeasurementEntry[]> {
  const res = await fetch(
    `${BASE_URL}/api/user-measurements/measurements`,
    { headers: makeHeaders(config) }
  );
  if (!res.ok) {
    throw new Error(`Failed to get measurements: ${res.status}`);
  }
  const data = await res.json();
  return (data as { items?: MeasurementEntry[] }).items ?? (data as MeasurementEntry[]);
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
    { method: "DELETE", headers: makeHeaders(config) }
  );
  if (!res.ok) {
    throw new Error(`Failed to delete measurement: ${res.status}`);
  }
}
```

- [ ] **Step 2: Add measurement methods to MFPClient**

Add to `src/client/index.ts`:
```typescript
import { getMeasurements, upsertMeasurement, deleteMeasurement } from "./measurement.js";
import type { MeasurementEntry } from "./types.js";

// Add to MFPClient class:

  async getMeasurements(): Promise<MeasurementEntry[]> {
    return getMeasurements(this.config);
  }

  async upsertMeasurement(measurement: {
    type: string;
    value: number;
    unit: string;
    date: string;
  }): Promise<MeasurementEntry> {
    return upsertMeasurement(this.config, measurement);
  }

  async deleteMeasurement(id: string): Promise<void> {
    return deleteMeasurement(this.config, id);
  }
```

- [ ] **Step 3: Create weight command**

`src/commands/weight.ts`:
```typescript
import { Command } from "commander";
import { MFPClient } from "../client/index.js";
import { loadAuth } from "../utils/config.js";
import { outputResult, outputError, createTable } from "../utils/output.js";
import type { MeasurementEntry } from "../client/types.js";

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export function registerWeightCommand(program: Command): void {
  program
    .command("weight [value]")
    .description("Record or view weight (kg)")
    .option("--date <date>", "Date (YYYY-MM-DD)", todayStr())
    .option("--history", "Show weight history")
    .option("--limit <n>", "Number of entries to show", "10")
    .option("--json", "Output as JSON")
    .action(async (value: string | undefined, opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in.", opts.json);
          return;
        }

        const client = new MFPClient(config);

        if (value) {
          // Record weight
          const entry = await client.upsertMeasurement({
            type: "Weight",
            value: parseFloat(value),
            unit: "kg",
            date: opts.date,
          });
          outputResult(entry, opts.json, () => {
            console.log(`Recorded: ${value} kg on ${opts.date}`);
          });
        } else {
          // Show weight
          const measurements = await client.getMeasurements();
          const weights = measurements
            .filter((m: MeasurementEntry) => m.type === "Weight" || m.type === "weight")
            .sort((a: MeasurementEntry, b: MeasurementEntry) =>
              new Date(b.date).getTime() - new Date(a.date).getTime()
            );

          const limit = opts.history ? parseInt(opts.limit) : 1;
          const display = weights.slice(0, limit);

          outputResult(display, opts.json, (entries: MeasurementEntry[]) => {
            if (entries.length === 0) {
              console.log("No weight records found.");
              return;
            }
            if (!opts.history) {
              const latest = entries[0];
              console.log(`Latest: ${latest.value} ${latest.unit} (${latest.date})`);
              return;
            }
            const table = createTable(["Date", "Weight (kg)", "Change"]);
            entries.forEach((e: MeasurementEntry, i: number) => {
              const prev = entries[i + 1];
              const change = prev
                ? `${(e.value - prev.value) >= 0 ? "+" : ""}${(e.value - prev.value).toFixed(1)}`
                : "-";
              table.push([e.date, e.value, change]);
            });
            console.log(table.toString());
          });
        }
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });
}
```

- [ ] **Step 4: Register weight command**

Add to `src/index.ts`:
```typescript
import { registerWeightCommand } from "./commands/weight.js";
registerWeightCommand(program);
```

- [ ] **Step 5: Test weight command**

Run: `npx tsx src/index.ts weight --json`
Expected: Latest weight entry in JSON

Run: `npx tsx src/index.ts weight --history`
Expected: Table of weight history with change column

- [ ] **Step 6: Commit**

```bash
git add src/client/measurement.ts src/commands/weight.ts src/client/index.ts src/index.ts
git commit -m "feat: add weight recording and history"
```

---

### Task 7: Water Client + Command

**Files:**
- Create: `src/client/water.ts`
- Create: `src/commands/water.ts`
- Modify: `src/client/index.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Create water client**

`src/client/water.ts`:
```typescript
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
  if (!res.ok) {
    throw new Error(`Failed to read water: ${res.status}`);
  }
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
```

- [ ] **Step 2: Add water methods to MFPClient**

Add to `src/client/index.ts`:
```typescript
import { readWater, logWater } from "./water.js";
import type { WaterEntry } from "./types.js";

// Add to MFPClient class:

  async readWater(date: string): Promise<WaterEntry> {
    return readWater(this.config, date);
  }

  async logWater(cups: number, date: string): Promise<WaterEntry> {
    return logWater(this.config, { cups, date });
  }
```

- [ ] **Step 3: Create water command**

`src/commands/water.ts`:
```typescript
import { Command } from "commander";
import { MFPClient } from "../client/index.js";
import { loadAuth } from "../utils/config.js";
import { outputResult, outputError } from "../utils/output.js";

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export function registerWaterCommand(program: Command): void {
  program
    .command("water [cups]")
    .description("Log or view water intake (cups)")
    .option("--date <date>", "Date (YYYY-MM-DD)", todayStr())
    .option("--json", "Output as JSON")
    .action(async (cups: string | undefined, opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in.", opts.json);
          return;
        }

        const client = new MFPClient(config);

        if (cups) {
          const entry = await client.logWater(parseInt(cups), opts.date);
          outputResult(entry, opts.json, () => {
            console.log(`Logged: ${cups} cups of water on ${opts.date}`);
          });
        } else {
          const entry = await client.readWater(opts.date);
          outputResult(entry, opts.json, () => {
            console.log(`Water today: ${entry.cups} cups (${entry.milliliters} ml)`);
          });
        }
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });
}
```

- [ ] **Step 4: Register water command**

Add to `src/index.ts`:
```typescript
import { registerWaterCommand } from "./commands/water.js";
registerWaterCommand(program);
```

- [ ] **Step 5: Test water command**

Run: `npx tsx src/index.ts water --json`
Expected: JSON with cups and milliliters for today

- [ ] **Step 6: Commit**

```bash
git add src/client/water.ts src/commands/water.ts src/client/index.ts src/index.ts
git commit -m "feat: add water intake tracking"
```

---

### Task 8: Exercise Client + Commands

**Files:**
- Create: `src/client/exercise.ts`
- Create: `src/commands/exercise.ts`
- Modify: `src/client/index.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Create exercise client**

`src/client/exercise.ts`:
```typescript
import type { AuthConfig, ExerciseEntry } from "./types.js";

const BASE_URL = "https://www.myfitnesspal.com";

function makeHeaders(config: AuthConfig): Record<string, string> {
  return {
    Cookie: `__Secure-next-auth.session-token=${config.sessionToken}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

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
  if (!res.ok) {
    throw new Error(`Exercise search failed: ${res.status}`);
  }
  const data = await res.json();
  return (data as { items?: ExerciseSearchResult[] }).items ?? (data as ExerciseSearchResult[]);
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
  if (!res.ok) {
    throw new Error(`Failed to delete exercise: ${res.status}`);
  }
}
```

- [ ] **Step 2: Add exercise methods to MFPClient**

Add to `src/client/index.ts`:
```typescript
import {
  searchExercises,
  logExercise,
  deleteExercise,
  type ExerciseSearchResult,
} from "./exercise.js";
import type { ExerciseEntry } from "./types.js";

// Add to MFPClient class:

  async searchExercises(query: string): Promise<ExerciseSearchResult[]> {
    return searchExercises(this.config, query);
  }

  async logExercise(exercise: {
    exercise_id: string;
    duration_minutes: number;
    calories_burned?: number;
    date: string;
  }): Promise<ExerciseEntry> {
    return logExercise(this.config, exercise);
  }

  async deleteExercise(id: string): Promise<void> {
    return deleteExercise(this.config, id);
  }
```

- [ ] **Step 3: Create exercise command**

`src/commands/exercise.ts`:
```typescript
import { Command } from "commander";
import { MFPClient } from "../client/index.js";
import { loadAuth } from "../utils/config.js";
import { outputResult, outputError, createTable } from "../utils/output.js";

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export function registerExerciseCommand(program: Command): void {
  const exercise = program
    .command("exercise")
    .description("Exercise management");

  exercise
    .command("search <query>")
    .description("Search for exercises")
    .option("--json", "Output as JSON")
    .action(async (query: string, opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in.", opts.json);
          return;
        }

        const client = new MFPClient(config);
        const results = await client.searchExercises(query);

        outputResult(results, opts.json, (items) => {
          if (items.length === 0) {
            console.log("No exercises found.");
            return;
          }
          const table = createTable(["#", "ID", "Name", "Type"]);
          items.forEach((item, i) => {
            table.push([i + 1, item.id, item.description.substring(0, 40), item.type]);
          });
          console.log(table.toString());
        });
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });

  exercise
    .command("log <exerciseId>")
    .description("Log an exercise")
    .option("--duration <minutes>", "Duration in minutes", "30")
    .option("--calories <cal>", "Calories burned (optional)")
    .option("--date <date>", "Date (YYYY-MM-DD)", todayStr())
    .option("--json", "Output as JSON")
    .action(async (exerciseId: string, opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in.", opts.json);
          return;
        }

        const client = new MFPClient(config);
        const entry = await client.logExercise({
          exercise_id: exerciseId,
          duration_minutes: parseInt(opts.duration),
          calories_burned: opts.calories ? parseInt(opts.calories) : undefined,
          date: opts.date,
        });

        outputResult(entry, opts.json, () => {
          console.log(
            `Logged: ${entry.name} for ${entry.duration_minutes}min (${entry.calories_burned} cal burned)`
          );
        });
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });
}
```

- [ ] **Step 4: Register exercise command**

Add to `src/index.ts`:
```typescript
import { registerExerciseCommand } from "./commands/exercise.js";
registerExerciseCommand(program);
```

- [ ] **Step 5: Test exercise search**

Run: `npx tsx src/index.ts exercise search "running" --json`
Expected: JSON array of exercise results with id, description, type

- [ ] **Step 6: Commit**

```bash
git add src/client/exercise.ts src/commands/exercise.ts src/client/index.ts src/index.ts
git commit -m "feat: add exercise search and logging"
```

---

### Task 9: Nutrient Goals Client + Command

**Files:**
- Create: `src/client/goals.ts`
- Create: `src/commands/goals.ts`
- Modify: `src/client/index.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Create goals client**

`src/client/goals.ts`:
```typescript
import type { AuthConfig, NutrientGoals } from "./types.js";

const BASE_URL = "https://www.myfitnesspal.com";

function makeHeaders(config: AuthConfig): Record<string, string> {
  return {
    Cookie: `__Secure-next-auth.session-token=${config.sessionToken}`,
    Accept: "application/json",
  };
}

export async function getNutrientGoals(
  config: AuthConfig,
  date?: string
): Promise<NutrientGoals> {
  const params = date ? `?date=${date}` : "";
  const res = await fetch(
    `${BASE_URL}/api/services/nutrient-goals${params}`,
    { headers: makeHeaders(config) }
  );
  if (!res.ok) {
    throw new Error(`Failed to get nutrient goals: ${res.status}`);
  }
  const data = await res.json();
  // API returns an array of goal periods; return the first/current one
  const goals = Array.isArray(data) ? data[0] : data;
  return goals as NutrientGoals;
}
```

- [ ] **Step 2: Add goals method to MFPClient**

Add to `src/client/index.ts`:
```typescript
import { getNutrientGoals } from "./goals.js";
import type { NutrientGoals } from "./types.js";

// Add to MFPClient class:

  async getNutrientGoals(date?: string): Promise<NutrientGoals> {
    return getNutrientGoals(this.config, date);
  }
```

- [ ] **Step 3: Create goals command**

`src/commands/goals.ts`:
```typescript
import { Command } from "commander";
import { MFPClient } from "../client/index.js";
import { loadAuth } from "../utils/config.js";
import { outputResult, outputError, createTable } from "../utils/output.js";

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export function registerGoalsCommand(program: Command): void {
  program
    .command("goals")
    .description("View nutrient goals")
    .option("--date <date>", "Date (YYYY-MM-DD)", todayStr())
    .option("--json", "Output as JSON")
    .action(async (opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in.", opts.json);
          return;
        }

        const client = new MFPClient(config);
        const goals = await client.getNutrientGoals(opts.date);

        outputResult(goals, opts.json, (g) => {
          const table = createTable(["Nutrient", "Goal"]);
          table.push(
            ["Calories", `${g.energy} kcal`],
            ["Protein", `${g.protein} g`],
            ["Carbs", `${g.carbohydrates} g`],
            ["Fat", `${g.fat} g`]
          );
          console.log(table.toString());
        });
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });
}
```

- [ ] **Step 4: Register goals command**

Add to `src/index.ts`:
```typescript
import { registerGoalsCommand } from "./commands/goals.js";
registerGoalsCommand(program);
```

- [ ] **Step 5: Test goals command**

Run: `npx tsx src/index.ts goals --json`
Expected: JSON with energy, protein, carbohydrates, fat goals

Run: `npx tsx src/index.ts goals`
Expected: Table showing daily nutrient goals

- [ ] **Step 6: Commit**

```bash
git add src/client/goals.ts src/commands/goals.ts src/client/index.ts src/index.ts
git commit -m "feat: add nutrient goals display"
```

---

### Task 10: Final Integration and README

**Files:**
- Modify: `src/index.ts` (verify all commands registered)
- Create: `README.md`

- [ ] **Step 1: Verify final index.ts has all commands**

`src/index.ts` should have:
```typescript
#!/usr/bin/env node
import { Command } from "commander";
import { registerAuthCommands } from "./commands/auth.js";
import { registerSearchCommand } from "./commands/search.js";
import { registerLogCommand } from "./commands/log.js";
import { registerDiaryCommand } from "./commands/diary.js";
import { registerWeightCommand } from "./commands/weight.js";
import { registerWaterCommand } from "./commands/water.js";
import { registerExerciseCommand } from "./commands/exercise.js";
import { registerGoalsCommand } from "./commands/goals.js";

const program = new Command();

program
  .name("mfp")
  .description("CLI for MyFitnessPal")
  .version("0.1.0");

registerAuthCommands(program);
registerSearchCommand(program);
registerLogCommand(program);
registerDiaryCommand(program);
registerWeightCommand(program);
registerWaterCommand(program);
registerExerciseCommand(program);
registerGoalsCommand(program);

program.parse();
```

- [ ] **Step 2: Create README.md**

```markdown
# myfitnesspal-cli

CLI for MyFitnessPal — reverse-engineered internal API.

## Install

```bash
npm install -g myfitnesspal-cli
```

Or run directly:
```bash
npx myfitnesspal-cli
```

## Setup

### Option 1: Login with credentials

```bash
mfp login
```

### Option 2: Set session cookie manually

Copy `__Secure-next-auth.session-token` from your browser (DevTools → Application → Cookies):

```bash
mfp auth set-cookie "eyJhbG..."
```

## Commands

### Authentication
```bash
mfp login                          # Login with email/password
mfp auth set-cookie <token>        # Set session cookie manually
mfp auth status                    # Check auth status
```

### Food Search
```bash
mfp search "chicken breast"        # Search for foods
mfp search "おにぎり" --per-page 5  # Japanese food search
```

### Food Logging
```bash
mfp log "chicken breast"           # Interactive: search → select → log
mfp log <foodId> --serving-size <id> --servings 2 --meal lunch  # Programmatic
```

### Diary
```bash
mfp diary                          # View today's diary
mfp diary 2026-04-09               # View specific date
mfp diary delete <entryId>         # Delete an entry
```

### Weight
```bash
mfp weight                         # Show latest weight
mfp weight 106.3                   # Record weight
mfp weight --history --limit 30    # Show weight history
```

### Water
```bash
mfp water                          # Show today's water intake
mfp water 8                        # Log 8 cups of water
```

### Exercise
```bash
mfp exercise search "running"      # Search exercises
mfp exercise log <id> --duration 30 --calories 300  # Log exercise
```

### Goals
```bash
mfp goals                          # Show nutrient goals
```

### JSON Output (for AI agents)
All commands support `--json` for structured output:
```bash
mfp diary --json
mfp search "rice" --json
```

## How It Works

This CLI uses MyFitnessPal's internal web API (the same endpoints the website uses). Authentication is via session cookies from the Next.js/next-auth stack.

**Note:** This is an unofficial tool. MFP may change their internal API at any time.

## License

MIT
```

- [ ] **Step 3: Run full help to verify all commands**

Run: `npx tsx src/index.ts --help`
Expected: Shows all commands: login, auth, search, log, diary, weight, water, exercise, goals

- [ ] **Step 4: Run end-to-end smoke test**

Run: `npx tsx src/index.ts auth status --json`
Run: `npx tsx src/index.ts goals --json`
Run: `npx tsx src/index.ts diary --json`
Run: `npx tsx src/index.ts search "rice" --per-page 3 --json`
Run: `npx tsx src/index.ts weight --json`
Run: `npx tsx src/index.ts water --json`
Expected: All return valid JSON with `success: true`

- [ ] **Step 5: Commit and push**

```bash
git add README.md src/index.ts
git commit -m "feat: add README and finalize CLI integration"
git push origin main
```
