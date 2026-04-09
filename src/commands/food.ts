import { Command } from "commander";
import { MFPClient } from "../client/index.js";
import { loadAuth } from "../utils/config.js";
import { outputResult, outputError, createTable, todayStr } from "../utils/output.js";
import type { FoodItem } from "../client/types.js";

export function registerFoodCommand(program: Command): void {
  const food = program.command("food").description("Food management");

  food.command("get <foodId>")
    .description("Get food details by ID")
    .option("--json", "Output as JSON")
    .action(async (foodId: string, opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in. Run `mfp login` first.", opts.json);
          return;
        }

        const client = new MFPClient(config);
        const item = await client.getFoodById(foodId);

        outputResult(item, opts.json, (item: FoodItem) => {
          const nc = item.nutritional_contents;
          console.log(`\n  ${item.description}`);
          if (item.brand_name || item.brand) {
            console.log(`  Brand: ${item.brand_name || item.brand}`);
          }
          console.log(`  Type: ${item.type} | Verified: ${item.verified ? "Yes" : "No"}`);
          console.log();

          const nutTable = createTable(["Nutrient", "Value"]);
          nutTable.push(
            ["Calories", `${nc.energy?.value ?? "-"} ${nc.energy?.unit ?? "kcal"}`],
            ["Protein", `${nc.protein ?? "-"} g`],
            ["Carbohydrates", `${nc.carbohydrates ?? "-"} g`],
            ["Fat", `${nc.fat ?? "-"} g`],
            ["Fiber", `${nc.fiber ?? "-"} g`],
            ["Sugar", `${nc.sugar ?? "-"} g`],
            ["Sodium", `${nc.sodium ?? "-"} mg`],
          );
          console.log(nutTable.toString());

          if (item.serving_sizes.length > 0) {
            console.log("\n  Serving Sizes:");
            const srvTable = createTable(["ID", "Unit", "Size", "Multiplier"]);
            for (const ss of item.serving_sizes) {
              srvTable.push([ss.id, ss.unit, ss.value, ss.nutrition_multiplier]);
            }
            console.log(srvTable.toString());
          }
        });
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });

  food.command("my-foods")
    .description("List your custom foods")
    .option("--json", "Output as JSON")
    .action(async (opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in. Run `mfp login` first.", opts.json);
          return;
        }

        const client = new MFPClient(config);
        const foods = await client.getMyFoods();

        outputResult(foods, opts.json, (foods: FoodItem[]) => {
          if (foods.length === 0) {
            console.log("No custom foods found.");
            return;
          }
          const table = createTable(["#", "ID", "Name", "Brand", "Cal", "P", "C", "F"]);
          foods.forEach((item: FoodItem, i: number) => {
            const nc = item.nutritional_contents;
            table.push([
              i + 1,
              item.id,
              item.description.substring(0, 30),
              (item.brand_name || item.brand || "-").substring(0, 15),
              nc.energy?.value ?? "-",
              nc.protein ?? "-",
              nc.carbohydrates ?? "-",
              nc.fat ?? "-",
            ]);
          });
          console.log(table.toString());
        });
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });

  food.command("create")
    .description("Create a custom food")
    .requiredOption("--name <name>", "Food name")
    .option("--brand <brand>", "Brand name")
    .requiredOption("--calories <cal>", "Calories per serving")
    .option("--protein <g>", "Protein (g)", "0")
    .option("--carbs <g>", "Carbohydrates (g)", "0")
    .option("--fat <g>", "Fat (g)", "0")
    .option("--serving-unit <unit>", "Serving unit", "serving")
    .option("--serving-size <n>", "Serving size", "1")
    .option("--json", "Output as JSON")
    .action(async (opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in. Run `mfp login` first.", opts.json);
          return;
        }

        const client = new MFPClient(config);
        const result = await client.createCustomFood({
          description: opts.name,
          brand_name: opts.brand,
          serving_sizes: [{
            unit: opts.servingUnit,
            value: parseFloat(opts.servingSize),
            nutrition_multiplier: 1,
          }],
          nutritional_contents: {
            energy: { value: parseFloat(opts.calories), unit: "calories" },
            protein: parseFloat(opts.protein),
            carbohydrates: parseFloat(opts.carbs),
            fat: parseFloat(opts.fat),
          },
        });

        outputResult(result, opts.json, (item: FoodItem) => {
          console.log(`Created custom food: ${item.description} (ID: ${item.id})`);
        });
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });

  food.command("update <foodId>")
    .description("Update a custom food")
    .option("--name <name>", "Food name")
    .option("--brand <brand>", "Brand name")
    .option("--calories <cal>", "Calories per serving")
    .option("--protein <g>", "Protein (g)")
    .option("--carbs <g>", "Carbohydrates (g)")
    .option("--fat <g>", "Fat (g)")
    .option("--data <json>", "Raw JSON data to update")
    .option("--json", "Output as JSON")
    .action(async (foodId: string, opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in. Run `mfp login` first.", opts.json);
          return;
        }

        const updates: Record<string, unknown> = {};
        if (opts.name) updates.description = opts.name;
        if (opts.brand) updates.brand_name = opts.brand;
        if (opts.data) {
          const parsed = JSON.parse(opts.data) as Record<string, unknown>;
          Object.assign(updates, parsed);
        }
        // Build nutritional_contents if any nutrient flags provided
        const nc: Record<string, unknown> = {};
        if (opts.calories) nc.energy = { value: parseFloat(opts.calories), unit: "calories" };
        if (opts.protein) nc.protein = parseFloat(opts.protein);
        if (opts.carbs) nc.carbohydrates = parseFloat(opts.carbs);
        if (opts.fat) nc.fat = parseFloat(opts.fat);
        if (Object.keys(nc).length > 0) updates.nutritional_contents = nc;

        if (Object.keys(updates).length === 0) {
          outputError("No updates specified. Use --name, --calories, --protein, --carbs, --fat, or --data.", opts.json);
          return;
        }

        const client = new MFPClient(config);
        const result = await client.updateCustomFood(foodId, updates);

        outputResult(result, opts.json, (item: FoodItem) => {
          console.log(`Updated food: ${item.description} (ID: ${item.id})`);
        });
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });

  food.command("delete <foodId>")
    .description("Delete a custom food")
    .option("--json", "Output as JSON")
    .action(async (foodId: string, opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in. Run `mfp login` first.", opts.json);
          return;
        }

        const client = new MFPClient(config);
        await client.deleteCustomFood(foodId);

        outputResult({ deleted: foodId }, opts.json, () => {
          console.log(`Deleted custom food: ${foodId}`);
        });
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });

  food.command("recent")
    .description("Show recently used foods")
    .option("--days <n>", "Number of days to look back", "30")
    .option("--json", "Output as JSON")
    .action(async (opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in. Run `mfp login` first.", opts.json);
          return;
        }

        const client = new MFPClient(config);
        const toDate = todayStr();
        const fromDate = daysAgo(parseInt(opts.days));
        const result = await client.getTopFoods(fromDate, toDate, ["recent"]);

        outputResult(result, opts.json, (data: unknown) => {
          const items = extractTopFoodItems(data);
          if (items.length === 0) {
            console.log("No recent foods found.");
            return;
          }
          const table = createTable(["#", "ID", "Name", "Brand", "Cal"]);
          items.forEach((item, i) => {
            table.push([
              i + 1,
              item.id,
              item.description.substring(0, 30),
              (item.brand_name || "-").substring(0, 15),
              item.nutritional_contents?.energy?.value ?? "-",
            ]);
          });
          console.log(table.toString());
        });
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });

  food.command("frequent")
    .description("Show frequently used foods")
    .option("--days <n>", "Number of days to look back", "30")
    .option("--json", "Output as JSON")
    .action(async (opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in. Run `mfp login` first.", opts.json);
          return;
        }

        const client = new MFPClient(config);
        const toDate = todayStr();
        const fromDate = daysAgo(parseInt(opts.days));
        const result = await client.getTopFoods(fromDate, toDate, ["frequent"]);

        outputResult(result, opts.json, (data: unknown) => {
          const items = extractTopFoodItems(data);
          if (items.length === 0) {
            console.log("No frequently used foods found.");
            return;
          }
          const table = createTable(["#", "ID", "Name", "Brand", "Cal"]);
          items.forEach((item, i) => {
            table.push([
              i + 1,
              item.id,
              item.description.substring(0, 30),
              (item.brand_name || "-").substring(0, 15),
              item.nutritional_contents?.energy?.value ?? "-",
            ]);
          });
          console.log(table.toString());
        });
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

interface TopFoodEntry {
  id: string;
  description: string;
  brand_name?: string;
  nutritional_contents?: { energy?: { value: number } };
}

function extractTopFoodItems(data: unknown): TopFoodEntry[] {
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.items)) return obj.items as TopFoodEntry[];
    // Try nested lists
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (Array.isArray(val)) return val as TopFoodEntry[];
      if (val && typeof val === "object" && Array.isArray((val as Record<string, unknown>).items)) {
        return (val as Record<string, unknown>).items as TopFoodEntry[];
      }
    }
  }
  return [];
}
