# myfitnesspal-cli

> **Unofficial** — This project is not affiliated with or endorsed by MyFitnessPal.

CLI for MyFitnessPal internal API.

## Install

```bash
git clone https://github.com/Andyyyy64/myfitnesspal-cli.git
cd myfitnesspal-cli
npm install
```

## Setup

### Option 1: Login with credentials

```bash
npx tsx src/index.ts login
```

You'll be prompted for your email and password. You can also pass them directly:

```bash
npx tsx src/index.ts login --email you@example.com --password yourpass
```

### Option 2: Set session cookie manually

If login doesn't work (e.g. Cloudflare challenge), copy `__Secure-next-auth.session-token` from your browser:

1. Open https://www.myfitnesspal.com and log in
2. Open DevTools (F12) → Application → Cookies → `www.myfitnesspal.com`
3. Copy the value of `__Secure-next-auth.session-token`

```bash
npx tsx src/index.ts auth set-cookie "eyJhbG..."
```

### Check auth status

```bash
npx tsx src/index.ts auth status
```

## Usage

All commands below use `npx tsx src/index.ts` as the prefix. If you build with `npm run build`, you can use `node dist/index.js` or link globally.

All commands support `--json` for structured JSON output (useful for AI agents and scripting).

---

### Food Search

```bash
mfp search <query>                          # Search for foods
mfp search "chicken breast" --per-page 10   # Limit results
mfp search "おにぎり" --page 1               # Pagination
```

### Food Logging

```bash
mfp log "chicken breast"                    # Interactive: search → select → log
mfp log "rice" 2 --meal dinner              # Interactive with 2 servings
mfp log <foodId> --serving-index <n> --servings 2 --meal lunch  # Programmatic (for AI agents)
```

Options: `--meal` (breakfast/lunch/dinner/snack), `--date`, `--serving-index` (0-based index into food's serving_sizes array), `--servings`

### Food Diary

```bash
mfp diary                                   # View today's diary
mfp diary 2026-04-09                        # View specific date
mfp diary day                               # Show today's day metadata/status
mfp diary day 2026-04-09                    # Show day metadata for specific date
mfp diary goals                             # Show diary-specific nutrient goals for today
mfp diary goals 2026-04-09                  # Show diary-specific nutrient goals for date
mfp diary get <entryId>                     # Get a single diary entry by ID
mfp diary delete <entryId>                  # Delete an entry
mfp diary update <entryId> --servings 3     # Update servings
mfp diary update <entryId> --meal dinner    # Move to different meal
mfp diary notes                             # View today's food notes
mfp diary notes 2026-04-09                  # View notes for specific date
mfp diary add-note "Felt good today"        # Add a food note
mfp diary copy --from-date 2026-04-08 --to-date 2026-04-09 --from-meal lunch --to-meal lunch  # Copy meal
mfp diary complete                          # Complete today's diary
mfp diary complete 2026-04-09               # Complete specific date
mfp diary report --from 2026-04-01 --to 2026-04-07  # Generate a diary report
```

### Food Management

```bash
mfp food get <foodId>                       # Get food details by ID
mfp food my-foods                           # List your custom foods
mfp food create --name "My Protein Shake" --calories 250 --protein 30 --carbs 10 --fat 5  # Create custom food
mfp food create --name "Homemade Bread" --calories 120 --brand "Homemade" --serving-unit "slice" --serving-size 1
mfp food update <foodId> --name "New Name" --calories 300  # Update a custom food
mfp food update <foodId> --protein 35 --carbs 15 --fat 8   # Update macros
mfp food delete <foodId>                    # Delete a custom food
mfp food recent                             # Recently used foods
mfp food recent --days 7                    # Last 7 days
mfp food frequent                           # Frequently used foods
mfp food frequent --days 90                 # Last 90 days
```

### Saved Meals

```bash
mfp meals list                              # List saved meals
mfp meals delete <mealId>                   # Delete a saved meal
```

### Weight & Measurements

```bash
mfp weight                                  # Show latest weight
mfp weight 106.3                            # Record weight (kg)
mfp weight 105.0 --date 2026-04-10          # Record for specific date
mfp weight --history                        # Show weight history
mfp weight --history --limit 30             # Last 30 entries
mfp weight get <id>                         # Get a measurement by ID
mfp weight delete <id>                      # Delete a measurement by ID
mfp weight types                            # List measurement types (Neck, Waist, etc.)
mfp weight add-type "Chest"                 # Add custom measurement type
mfp weight delete-type <typeId>             # Delete measurement type
```

### Water

```bash
mfp water                                   # Show today's water intake
mfp water 8                                 # Log 8 cups of water
mfp water 2.5 --date 2026-04-10             # Log for specific date
```

### Exercise

```bash
mfp exercise search "running"               # Search exercises
mfp exercise list                            # List all exercises alphabetically
mfp exercise my-exercises                    # List your custom exercises
mfp exercise get <id>                        # Get exercise details by ID
mfp exercise log <id> --duration 30          # Log 30 min exercise
mfp exercise log <id> --duration 45 --calories 500  # Log with custom calories
mfp exercise calories <id>                   # Get calories burned info
mfp exercise update <id> --duration 60       # Update duration
mfp exercise delete <id>                     # Delete exercise entry
```

### Nutrient Goals

```bash
mfp goals                                   # View current nutrient goals
mfp goals --date 2026-04-09                  # View goals for specific date
mfp goals update --calories 2000 --protein 150 --carbs 200 --fat 60  # Update goals
```

### Account & Settings

```bash
mfp account profile                          # View user profile
mfp account settings                         # View diary settings
mfp account update --username "newname"      # Update user profile
mfp account update --data '{"key":"value"}'  # Update profile with raw JSON
mfp account update-settings --data '{"key":"value"}'  # Update diary settings
mfp account diary-profile                    # View diary profile
mfp account digest                           # Weekly digest/summary
mfp account digest --from 2026-04-01 --to 2026-04-07  # Custom date range
mfp account report net calories 30           # Get a report (type, name, length)
mfp account export                           # Request data export from MFP
```

---

## JSON Output (for AI agents)

All commands support `--json` for structured output:

```bash
mfp diary --json
mfp search "rice" --json
mfp weight --history --json
mfp goals --json
```

JSON responses follow this format:

```json
{
  "success": true,
  "data": { ... }
}
```

On error:

```json
{
  "success": false,
  "error": "Error message"
}
```

## Claude Code Skills

Pre-built slash commands for [Claude Code](https://claude.com/claude-code) are available in the `skills/` directory.

| Skill | Command | Description |
|-------|---------|-------------|
| `mfp-log` | `/mfp-log` | Log food from natural language ("ate 200g chicken breast") |
| `mfp-diary` | `/mfp-diary` | View daily nutrition status and report |
| `mfp-status` | `/mfp-status` | Overview of weight, food, water, and goals |
| `mfp-weight` | `/mfp-weight` | Record weight and track progress |

### Install skills

Copy to your Claude Code commands directory:

```bash
cp skills/*.md ~/.claude/commands/
```

Then use `/mfp-log`, `/mfp-diary`, etc. as slash commands in Claude Code.

## Architecture

```
src/
├── client/           # Core SDK (API layer)
│   ├── index.ts      # MFPClient class (facade)
│   ├── constants.ts  # Shared constants (BASE_URL, headers)
│   ├── types.ts      # TypeScript interfaces
│   ├── auth.ts       # Authentication
│   ├── food.ts       # Food search (buildId handling)
│   ├── foods.ts      # Food management (CRUD, top foods)
│   ├── diary.ts      # Diary CRUD + notes, copy, complete
│   ├── exercise.ts   # Exercise search, log, lookup
│   ├── measurement.ts # Weight & measurement types
│   ├── water.ts      # Water intake
│   ├── goals.ts      # Nutrient goals
│   ├── meals.ts      # Saved meals
│   └── account.ts    # Profile, settings, digest, export
├── commands/         # CLI layer (commander)
│   ├── auth.ts       # login, auth set-cookie, auth status
│   ├── search.ts     # search
│   ├── log.ts        # log (interactive + programmatic)
│   ├── diary.ts      # diary view, delete, update, notes, copy, complete
│   ├── food.ts       # food get, my-foods, create, delete, recent, frequent
│   ├── meals.ts      # meals list, delete
│   ├── weight.ts     # weight record, history, measurement types
│   ├── water.ts      # water log, view
│   ├── exercise.ts   # exercise search, list, log, calories, update, delete
│   ├── goals.ts      # goals view, update
│   └── account.ts    # profile, settings, digest, export
├── utils/
│   ├── config.ts     # ~/.config/mfp-cli/auth.json management
│   └── output.ts     # Table/JSON output, todayStr helper
└── index.ts          # CLI entrypoint
```

The Core SDK (`src/client/`) can be imported directly for programmatic use or future MCP server integration.

## How It Works

This CLI uses MyFitnessPal's internal web API (the same endpoints the website uses). Authentication is via session cookies from the Next.js/next-auth stack.

**Disclaimer:** This is an unofficial, reverse-engineered tool. It is not affiliated with, endorsed by, or associated with MyFitnessPal in any way. MFP may change their internal API at any time, which could break this tool without notice. Use at your own risk.

## License

MIT
