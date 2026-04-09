Record weight to MyFitnessPal and track progress.

## Prerequisites

- CLI: `/home/andy/project/myfitnesspal-cli`
- Run: `cd /home/andy/project/myfitnesspal-cli && npx tsx src/index.ts <command>`

## Steps

### If user reports a weight value

```bash
cd /home/andy/project/myfitnesspal-cli && npx tsx src/index.ts weight <value> --json
```

After recording, report:
- Recorded weight
- Change from previous entry
- Remaining to goal (read goal from user's profile/memory if available)

### If user asks for weight history

```bash
cd /home/andy/project/myfitnesspal-cli && npx tsx src/index.ts weight --history --limit 14 --json
```

Report conversationally:
- 2-week trend (up/down/stable)
- Highest and lowest values
- Average weekly change (kg/week)
- Estimated time to reach goal at current pace (if goal is known)

## Notes

- Daily weight fluctuation of 1-2kg is normal — don't overreact to single data points
- A healthy rate of loss is 0.5-1.0 kg/week
- Weight can stall while body composition improves (muscle gain + fat loss)
