# Usage Examples

Real-world workflows for common tasks.

## Daily Diet Tracking Workflow

### Morning: Record weight

```bash
mfp weight 105.8
# Recorded: 105.8 kg on 2026-04-09
```

### Log breakfast

```bash
# Interactive: search and select
mfp log "oatmeal" --meal breakfast

# Or programmatic with known food ID
mfp log 17744153969781 --serving-size 169073006355685 --servings 1 --meal breakfast
```

### Check the day so far

```bash
mfp diary
# Shows table grouped by meal with calories, protein, carbs, fat totals
```

### Log water throughout the day

```bash
mfp water 2
mfp water 3   # adds more
```

### End of day: review and complete

```bash
mfp diary           # Review
mfp diary complete  # Mark day as complete
```

## AI Agent Workflow

All commands support `--json` for structured output:

```bash
# Search for food
mfp search "chicken breast" --per-page 5 --json

# Get food details
mfp food get 277237495260269 --json

# Log with exact IDs (no interactive prompts)
mfp log 277237495260269 --serving-size 169073006355685 --servings 2 --meal lunch --json

# Check diary
mfp diary --json

# Check remaining macros
mfp goals --json
mfp diary goals --json
```

## Weight Tracking

```bash
# Record daily
mfp weight 106.3

# View history
mfp weight --history --limit 14

# Output:
# Date       | Weight (kg) | Change
# 2026-04-09 | 105.8       | -0.5
# 2026-04-08 | 106.3       | -0.7
# 2026-04-07 | 107.0       | ...
```

## Custom Food Creation

```bash
# Create a food that doesn't exist in MFP
mfp food create \
  --name "Homemade Protein Bowl" \
  --brand "Homemade" \
  --calories 450 \
  --protein 40 \
  --carbs 35 \
  --fat 15 \
  --serving-unit "bowl" \
  --serving-size 1

# List your custom foods
mfp food my-foods

# Update if recipe changes
mfp food update <foodId> --calories 480 --protein 42
```

## Meal Copying

```bash
# Copy yesterday's lunch to today
mfp diary copy \
  --from-date 2026-04-08 \
  --to-date 2026-04-09 \
  --from-meal lunch \
  --to-meal lunch
```

## Exercise Logging

```bash
# Search for an exercise
mfp exercise search "bench press"

# Log it
mfp exercise log <exerciseId> --duration 45 --calories 250

# Or search for cardio
mfp exercise search "running"
mfp exercise log <exerciseId> --duration 30
```

## Weekly Review

```bash
# Get weekly digest
mfp account digest --from 2026-04-01 --to 2026-04-07 --json

# Check frequently eaten foods
mfp food frequent --days 7

# Review goals
mfp goals
```

## Scripting Examples

### Daily summary script

```bash
#!/bin/bash
echo "=== $(date +%Y-%m-%d) Diet Summary ==="
echo ""
echo "Weight:"
mfp weight
echo ""
echo "Diary:"
mfp diary
echo ""
echo "Water:"
mfp water
echo ""
echo "Goals:"
mfp goals
```

### Export diary to JSON

```bash
# Export a week of diary data
for i in $(seq 0 6); do
  date=$(date -d "2026-04-01 + $i days" +%Y-%m-%d)
  mfp diary "$date" --json > "diary-$date.json"
done
```

### Monitor weight trend

```bash
mfp weight --history --limit 30 --json | \
  jq '.data[] | {date, value}'
```
