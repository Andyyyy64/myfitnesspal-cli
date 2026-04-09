import { Command } from "commander";
import { MFPClient } from "../client/index.js";
import { loadAuth } from "../utils/config.js";
import { outputResult, outputError, createTable, todayStr } from "../utils/output.js";

export function registerGoalsCommand(program: Command): void {
  const goals = program
    .command("goals")
    .description("View or update nutrient goals")
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
        const g = await client.getNutrientGoals(opts.date);
        outputResult(g, opts.json, (g) => {
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

  goals
    .command("update")
    .description("Update nutrient goals")
    .option("--calories <n>", "Daily calorie goal")
    .option("--protein <n>", "Daily protein goal (g)")
    .option("--carbs <n>", "Daily carbs goal (g)")
    .option("--fat <n>", "Daily fat goal (g)")
    .option("--json", "Output as JSON")
    .action(async (opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in.", opts.json);
          return;
        }

        const updates: Record<string, unknown> = {};
        if (opts.calories !== undefined) updates.energy = parseFloat(opts.calories);
        if (opts.protein !== undefined) updates.protein = parseFloat(opts.protein);
        if (opts.carbs !== undefined) updates.carbohydrates = parseFloat(opts.carbs);
        if (opts.fat !== undefined) updates.fat = parseFloat(opts.fat);

        if (Object.keys(updates).length === 0) {
          outputError("Specify at least one goal to update (--calories, --protein, --carbs, --fat).", opts.json);
          return;
        }

        const client = new MFPClient(config);
        const result = await client.updateNutrientGoals(updates);
        outputResult(result, opts.json, () => {
          const parts: string[] = [];
          if (updates.energy !== undefined) parts.push(`Calories: ${updates.energy} kcal`);
          if (updates.protein !== undefined) parts.push(`Protein: ${updates.protein} g`);
          if (updates.carbohydrates !== undefined) parts.push(`Carbs: ${updates.carbohydrates} g`);
          if (updates.fat !== undefined) parts.push(`Fat: ${updates.fat} g`);
          console.log(`Goals updated: ${parts.join(", ")}`);
        });
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });
}
