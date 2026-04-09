import { Command } from "commander";
import inquirer from "inquirer";
import { MFPClient } from "../client/index.js";
import { loadAuth } from "../utils/config.js";
import { outputResult, outputError, todayStr } from "../utils/output.js";
import type { FoodItem } from "../client/types.js";

export function registerLogCommand(program: Command): void {
  program
    .command("log <food> [amount]")
    .description("Log a food entry")
    .option("--meal <meal>", "Meal: breakfast, lunch, dinner, snack", "lunch")
    .option("--date <date>", "Date (YYYY-MM-DD)", todayStr())
    .option("--serving-size <id>", "Serving size ID (skip interactive)")
    .option("--servings <n>", "Number of servings", "1")
    .option("--json", "Output as JSON")
    .action(async (food: string, amount: string | undefined, opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in.", opts.json);
          return;
        }

        const client = new MFPClient(config);

        // If serving-size is provided, treat food as a food ID (programmatic mode)
        if (opts.servingSize) {
          const entry = await client.createDiaryEntry({
            food_id: food,
            serving_size_id: opts.servingSize,
            servings: parseFloat(opts.servings),
            meal_name: opts.meal,
            entry_date: opts.date,
          });
          outputResult(entry, opts.json, () => {
            console.log(`Logged: ${food} (${opts.servings} servings) to ${opts.meal}`);
          });
          return;
        }

        // Interactive mode: search for food
        const result = await client.searchFood(food, 0, 10);
        if (result.items.length === 0) {
          outputError(`No foods found for "${food}"`, opts.json);
          return;
        }

        const { selectedIndex } = await inquirer.prompt([
          {
            type: "list",
            name: "selectedIndex",
            message: "Select a food:",
            choices: result.items.map((item: FoodItem, i: number) => ({
              name: `${item.description} (${item.brand_name || item.brand || "generic"}) - ${item.nutritional_contents.energy?.value ?? "?"}cal`,
              value: i,
            })),
          },
        ]);

        const selectedFood = result.items[selectedIndex];

        if (selectedFood.serving_sizes.length === 0) {
          outputError("This food has no serving sizes defined.", opts.json);
          return;
        }

        // Select serving size
        const { servingSizeIndex } = await inquirer.prompt([
          {
            type: "list",
            name: "servingSizeIndex",
            message: "Serving size:",
            choices: selectedFood.serving_sizes.map((ss, i) => ({
              name: `${ss.value} ${ss.unit}`,
              value: i,
            })),
          },
        ]);

        const selectedServing = selectedFood.serving_sizes[servingSizeIndex];

        // Number of servings
        let servings = parseFloat(opts.servings);
        if (amount) {
          servings = parseFloat(amount) || 1;
        }

        const entry = await client.createDiaryEntry({
          food_id: selectedFood.id,
          serving_size_id: selectedServing.id,
          servings,
          meal_name: opts.meal,
          entry_date: opts.date,
        });

        outputResult(entry, opts.json, () => {
          const cal = selectedFood.nutritional_contents.energy?.value ?? 0;
          console.log(
            `Logged: ${selectedFood.description} x${servings} to ${opts.meal} (${Math.round(cal * selectedServing.nutrition_multiplier * servings)} cal)`
          );
        });
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });
}
