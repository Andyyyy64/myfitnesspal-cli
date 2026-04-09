import { Command } from "commander";
import inquirer from "inquirer";
import { MFPClient } from "../client/index.js";
import { loadAuth } from "../utils/config.js";
import { outputResult, outputError, todayStr } from "../utils/output.js";
import type { FoodItem } from "../client/types.js";

const MEAL_MAP: Record<string, number> = {
  breakfast: 0,
  lunch: 1,
  dinner: 2,
  snack: 3,
  snacks: 3,
};

function mealNameToPosition(meal: string): number {
  return MEAL_MAP[meal.toLowerCase()] ?? 1;
}

export function registerLogCommand(program: Command): void {
  program
    .command("log <food> [amount]")
    .description("Log a food entry")
    .option("--meal <meal>", "Meal: breakfast, lunch, dinner, snack", "lunch")
    .option("--date <date>", "Date (YYYY-MM-DD)", todayStr())
    .option("--serving-index <n>", "Serving size index from food's serving_sizes array (0-based)")
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
        const mealPosition = mealNameToPosition(opts.meal);

        // If serving-index is provided, treat food as a food ID (programmatic mode)
        if (opts.servingIndex !== undefined) {
          // Need to fetch food details to get serving_size info
          const foodDetails = await client.getFoodById(food);
          const servingIdx = parseInt(opts.servingIndex);
          const ss = foodDetails.serving_sizes[servingIdx];
          if (!ss) {
            outputError(`Serving size index ${servingIdx} not found. Food has ${foodDetails.serving_sizes.length} serving sizes.`, opts.json);
            return;
          }

          const entry = await client.createDiaryEntry({
            food_id: food,
            food_version: (foodDetails as unknown as Record<string, unknown>).version as string | undefined,
            serving_size: {
              nutrition_multiplier: ss.nutrition_multiplier,
              unit: ss.unit,
              value: ss.value,
            },
            servings: parseFloat(opts.servings),
            meal_position: mealPosition,
            date: opts.date,
          });
          outputResult(entry, opts.json, () => {
            console.log(`Logged: ${foodDetails.description} (${opts.servings} servings) to ${opts.meal}`);
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
              name: `${item.description} (${item.brand_name || "generic"}) - ${item.nutritional_contents.energy?.value ?? "?"}cal`,
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
          food_version: (selectedFood as unknown as Record<string, unknown>).version as string | undefined,
          serving_size: {
            nutrition_multiplier: selectedServing.nutrition_multiplier,
            unit: selectedServing.unit,
            value: selectedServing.value,
          },
          servings,
          meal_position: mealPosition,
          date: opts.date,
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
