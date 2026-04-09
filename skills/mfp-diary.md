Check MyFitnessPal food diary and report daily nutrition status.

## Prerequisites

- CLI: `/home/andy/project/myfitnesspal-cli`
- Run: `cd /home/andy/project/myfitnesspal-cli && npx tsx src/index.ts <command>`

## Steps

### 1. Fetch diary data

```bash
cd /home/andy/project/myfitnesspal-cli && npx tsx src/index.ts diary <date> --json
```

Date is user-specified or defaults to today (YYYY-MM-DD format).

### 2. Fetch nutrient goals

```bash
cd /home/andy/project/myfitnesspal-cli && npx tsx src/index.ts goals --json
```

### 3. Fetch water intake

```bash
cd /home/andy/project/myfitnesspal-cli && npx tsx src/index.ts water --json
```

### 4. Build report

Summarize the following from fetched data:

**Meals (grouped by meal)**
- Food name, calories, protein/fat/carbs for each entry

**Daily totals vs goals**
- Calories: intake / goal
- Protein: intake / goal
- Carbs: intake / goal
- Fat: intake / goal
- Water: intake

**Remaining budget**
- How many calories left
- Whether protein target is met

**Brief advice**
- PFC balance commentary
- If protein is low, suggest protein-rich foods for the next meal

## Output style

Report conversationally, not as a rigid template table.
