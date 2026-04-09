import { Command } from "commander";
import { MFPClient } from "../client/index.js";
import { loadAuth } from "../utils/config.js";
import { outputResult, outputError, createTable, todayStr } from "../utils/output.js";

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
