import { Command } from "commander";
import { MFPClient } from "../client/index.js";
import { loadAuth } from "../utils/config.js";
import { outputResult, outputError, createTable, todayStr } from "../utils/output.js";
import type { DiaryEntry } from "../client/types.js";

export function registerDiaryCommand(program: Command): void {
  const diary = program
    .command("diary [date]")
    .description("View food diary (default: today)")
    .option("--json", "Output as JSON")
    .action(async (date: string | undefined, opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in. Run `mfp login` first.", opts.json);
          return;
        }

        const client = new MFPClient(config);
        const entries = await client.readDiary(date || todayStr());

        outputResult(entries, opts.json, (entries: DiaryEntry[]) => {
          if (entries.length === 0) {
            console.log("No entries for this date.");
            return;
          }

          // Group by meal
          const meals = new Map<string, DiaryEntry[]>();
          for (const entry of entries) {
            const meal = entry.meal_name || "Other";
            if (!meals.has(meal)) meals.set(meal, []);
            meals.get(meal)!.push(entry);
          }

          for (const [meal, mealEntries] of meals) {
            console.log(`\n--- ${meal} ---`);
            const table = createTable(["ID", "Food", "Servings", "Cal", "P", "C", "F"]);
            for (const e of mealEntries) {
              const nc = e.nutritional_contents;
              table.push([
                e.id,
                (e.food?.description || "Unknown").substring(0, 25),
                e.servings,
                nc?.energy?.value ?? "-",
                nc?.protein ?? "-",
                nc?.carbohydrates ?? "-",
                nc?.fat ?? "-",
              ]);
            }
            console.log(table.toString());
          }

          // Totals
          let totalCal = 0, totalP = 0, totalC = 0, totalF = 0;
          for (const e of entries) {
            const nc = e.nutritional_contents;
            totalCal += nc?.energy?.value ?? 0;
            totalP += nc?.protein ?? 0;
            totalC += nc?.carbohydrates ?? 0;
            totalF += nc?.fat ?? 0;
          }
          console.log(`\nTotal: ${totalCal} cal | P: ${totalP}g | C: ${totalC}g | F: ${totalF}g`);
        });
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });

  diary
    .command("day [date]")
    .description("Show day metadata/status")
    .option("--json", "Output as JSON")
    .action(async (date: string | undefined, opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in.", opts.json);
          return;
        }
        const client = new MFPClient(config);
        const result = await client.readDiaryDay(date || todayStr());
        outputResult(result, opts.json, (data: unknown) => {
          console.log(JSON.stringify(data, null, 2));
        });
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });

  diary
    .command("goals [date]")
    .description("Show diary-specific nutrient goals for a date")
    .option("--json", "Output as JSON")
    .action(async (date: string | undefined, opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in.", opts.json);
          return;
        }
        const client = new MFPClient(config);
        const result = await client.getDiaryNutrientGoals(date || todayStr());
        outputResult(result, opts.json, (data: unknown) => {
          console.log(JSON.stringify(data, null, 2));
        });
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });

  diary
    .command("get <entryId>")
    .description("Get a single diary entry by ID")
    .option("--json", "Output as JSON")
    .action(async (entryId: string, opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in.", opts.json);
          return;
        }
        const client = new MFPClient(config);
        const entry = await client.getDiaryEntry(entryId);
        outputResult(entry, opts.json, (e: DiaryEntry) => {
          const nc = e.nutritional_contents;
          const table = createTable(["Field", "Value"]);
          table.push(
            ["ID", e.id],
            ["Food", e.food?.description || "Unknown"],
            ["Meal", e.meal_name],
            ["Servings", String(e.servings)],
            ["Date", e.entry_date],
            ["Calories", String(nc?.energy?.value ?? "-")],
            ["Protein", `${nc?.protein ?? "-"} g`],
            ["Carbs", `${nc?.carbohydrates ?? "-"} g`],
            ["Fat", `${nc?.fat ?? "-"} g`],
          );
          console.log(table.toString());
        });
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });

  diary
    .command("report")
    .description("Generate a diary report")
    .requiredOption("--from <date>", "Start date (YYYY-MM-DD)")
    .requiredOption("--to <date>", "End date (YYYY-MM-DD)")
    .option("--data <json>", "Additional report parameters as JSON")
    .option("--json", "Output as JSON")
    .action(async (opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in.", opts.json);
          return;
        }
        const reportData: Record<string, unknown> = {
          from_date: opts.from,
          to_date: opts.to,
        };
        if (opts.data) {
          const parsed = JSON.parse(opts.data) as Record<string, unknown>;
          Object.assign(reportData, parsed);
        }
        const client = new MFPClient(config);
        const result = await client.generateDiaryReport(reportData);
        outputResult(result, opts.json, (data: unknown) => {
          console.log(JSON.stringify(data, null, 2));
        });
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });

  diary
    .command("delete <id>")
    .description("Delete a diary entry")
    .option("--json", "Output as JSON")
    .action(async (id: string, opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in.", opts.json);
          return;
        }
        const client = new MFPClient(config);
        await client.deleteDiaryEntry(id);
        outputResult({ message: "Entry deleted", id }, opts.json, () => {
          console.log(`Deleted entry ${id}`);
        });
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });

  diary
    .command("update <id>")
    .description("Update a diary entry")
    .option("--servings <number>", "Number of servings", parseFloat)
    .option("--serving-size <id>", "Serving size ID")
    .option("--meal <name>", "Meal name")
    .option("--json", "Output as JSON")
    .action(async (id: string, opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in.", opts.json);
          return;
        }
        const updates: { servings?: number; serving_size_id?: string; meal_name?: string } = {};
        if (opts.servings !== undefined) updates.servings = opts.servings;
        if (opts.servingSize) updates.serving_size_id = opts.servingSize;
        if (opts.meal) updates.meal_name = opts.meal;
        const client = new MFPClient(config);
        const result = await client.updateDiaryEntry(id, updates);
        outputResult(result, opts.json, (entry: DiaryEntry) => {
          console.log(`Updated entry ${entry.id}`);
        });
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });

  diary
    .command("notes [date]")
    .description("View diary notes for a date")
    .option("--type <type>", "Note type", "food")
    .option("--json", "Output as JSON")
    .action(async (date: string | undefined, opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in.", opts.json);
          return;
        }
        const client = new MFPClient(config);
        const result = await client.readDiaryNotes(date || todayStr(), opts.type);
        outputResult(result, opts.json, (data: unknown) => {
          console.log(JSON.stringify(data, null, 2));
        });
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });

  diary
    .command("add-note <note>")
    .description("Add a diary note")
    .option("--date <date>", "Date (YYYY-MM-DD)")
    .option("--type <type>", "Note type", "food")
    .option("--json", "Output as JSON")
    .action(async (note: string, opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in.", opts.json);
          return;
        }
        const client = new MFPClient(config);
        const result = await client.addDiaryNote({
          date: opts.date || todayStr(),
          note,
          note_type: opts.type,
        });
        outputResult(result, opts.json, () => {
          console.log("Note added.");
        });
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });

  diary
    .command("copy")
    .description("Copy a meal from one date to another")
    .requiredOption("--from-date <date>", "Source date (YYYY-MM-DD)")
    .requiredOption("--to-date <date>", "Destination date (YYYY-MM-DD)")
    .requiredOption("--from-meal <meal>", "Source meal name")
    .requiredOption("--to-meal <meal>", "Destination meal name")
    .option("--json", "Output as JSON")
    .action(async (opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in.", opts.json);
          return;
        }
        const client = new MFPClient(config);
        const result = await client.copyMeal({
          from_date: opts.fromDate,
          to_date: opts.toDate,
          from_meal: opts.fromMeal,
          to_meal: opts.toMeal,
        });
        outputResult(result, opts.json, () => {
          console.log(`Copied ${opts.fromMeal} from ${opts.fromDate} to ${opts.toMeal} on ${opts.toDate}`);
        });
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });

  diary
    .command("complete [date]")
    .description("Complete diary day")
    .option("--json", "Output as JSON")
    .action(async (date: string | undefined, opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in.", opts.json);
          return;
        }
        const client = new MFPClient(config);
        const result = await client.completeDiaryDay(date || todayStr());
        outputResult(result, opts.json, () => {
          console.log(`Diary day ${date || todayStr()} completed.`);
        });
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });
}
