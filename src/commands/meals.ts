import { Command } from "commander";
import { MFPClient } from "../client/index.js";
import { loadAuth } from "../utils/config.js";
import { outputResult, outputError, createTable } from "../utils/output.js";
import type { SavedMeal } from "../client/meals.js";

export function registerMealsCommand(program: Command): void {
  const meals = program.command("meals").description("Saved meals management");

  meals.command("list")
    .description("List saved meals")
    .option("--json", "Output as JSON")
    .action(async (opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in. Run `mfp login` first.", opts.json);
          return;
        }

        const client = new MFPClient(config);
        const mealsList = await client.getSavedMeals();

        outputResult(mealsList, opts.json, (mealsList: SavedMeal[]) => {
          if (mealsList.length === 0) {
            console.log("No saved meals found.");
            return;
          }
          const table = createTable(["#", "ID", "Name", "Items"]);
          mealsList.forEach((meal: SavedMeal, i: number) => {
            table.push([
              i + 1,
              meal.id,
              meal.name.substring(0, 30),
              meal.items.length,
            ]);
          });
          console.log(table.toString());
        });
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });

  meals.command("delete <mealId>")
    .description("Delete a saved meal")
    .option("--json", "Output as JSON")
    .action(async (mealId: string, opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in. Run `mfp login` first.", opts.json);
          return;
        }

        const client = new MFPClient(config);
        await client.deleteSavedMeal(mealId);

        outputResult({ deleted: mealId }, opts.json, () => {
          console.log(`Deleted saved meal: ${mealId}`);
        });
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });
}
