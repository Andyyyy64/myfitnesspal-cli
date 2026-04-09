Log food to MyFitnessPal. When the user describes what they ate in natural language, search and register it via the MFP CLI.

## Prerequisites

- CLI: `/home/andy/project/myfitnesspal-cli`
- Run: `cd /home/andy/project/myfitnesspal-cli && npx tsx src/index.ts <command>`
- Auth must be configured (`~/.config/mfp-cli/auth.json` exists)

## Steps

### 1. Parse user input

When the user says something like "ate 200g chicken breast" or "had curry for lunch":
- Extract the food name
- Extract quantity if given (g, pieces, cups, etc.)
- Determine meal timing (breakfast/lunch/dinner/snack — infer from time of day if not specified)
- Extract date if specified (default: today)

### 2. Search for food

```bash
cd /home/andy/project/myfitnesspal-cli && npx tsx src/index.ts search "<food name>" --per-page 10 --json
```

Select the most appropriate result based on:
- `description` and `brand_name` closest to user intent
- Prefer `verified: true`
- Prefer matching `country_code` for the user's locale
- Reasonable calorie/macro values

### 3. Calculate serving size

Check the food's `serving_sizes` array:
- If user said "200g", find a gram-based serving size and calculate `servings`
- If "1 piece", find a piece-based serving size
- If no exact match, use the closest serving size and adjust `servings`

### 4. Log the food

```bash
cd /home/andy/project/myfitnesspal-cli && npx tsx src/index.ts log <foodId> --serving-size <servingSizeId> --servings <n> --meal <meal> --json
```

### 5. Confirm

Report to user:
- Food name
- Calories
- Protein / Fat / Carbs
- Meal timing

### 6. Multiple foods

If user mentions multiple foods at once ("chicken, rice, and miso soup"), repeat steps 2-4 for each.

## Notes

- If search returns 0 results, try alternative keywords (Japanese → English, abbreviations → full names, etc.)
- If quantity is unknown, log 1 serving and ask user to confirm
- Always use `--json` and verify the response before reporting to user
