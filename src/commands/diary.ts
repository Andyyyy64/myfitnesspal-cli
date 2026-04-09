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
}
