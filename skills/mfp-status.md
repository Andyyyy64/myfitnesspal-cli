Check current MyFitnessPal status at a glance. Fetches weight, diary, water, and nutrient goals, then reports a summary.

## Prerequisites

- CLI: `/home/andy/project/myfitnesspal-cli`
- Run: `cd /home/andy/project/myfitnesspal-cli && npx tsx src/index.ts <command>`

## Steps

Run these commands in parallel (all with `--json`):

```bash
cd /home/andy/project/myfitnesspal-cli && npx tsx src/index.ts weight --json
cd /home/andy/project/myfitnesspal-cli && npx tsx src/index.ts diary --json
cd /home/andy/project/myfitnesspal-cli && npx tsx src/index.ts water --json
cd /home/andy/project/myfitnesspal-cli && npx tsx src/index.ts goals --json
cd /home/andy/project/myfitnesspal-cli && npx tsx src/index.ts weight --history --limit 7 --json
```

### Report

Summarize conversationally:

**Weight**
- Latest weight and date
- 7-day trend (up/down/stable)

**Today's food**
- If entries exist: meal contents and calorie/PFC totals
- If empty: "No entries logged yet"

**Water**
- Today's water intake

**Nutrition balance**
- Progress toward goals (calories, P, F, C)
- Remaining budget
