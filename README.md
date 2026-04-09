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
