import { Command } from "commander";
import { MFPClient } from "../client/index.js";
import { loadAuth } from "../utils/config.js";
import { outputResult, outputError, createTable } from "../utils/output.js";

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export function registerExerciseCommand(program: Command): void {
  const exercise = program
    .command("exercise")
    .description("Exercise management");

  exercise
    .command("search <query>")
    .description("Search for exercises")
    .option("--json", "Output as JSON")
    .action(async (query: string, opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in.", opts.json);
          return;
        }
        const client = new MFPClient(config);
        const results = await client.searchExercises(query);
        outputResult(results, opts.json, (items) => {
          if (items.length === 0) {
            console.log("No exercises found.");
            return;
          }
          const table = createTable(["#", "ID", "Name", "Type"]);
          items.forEach((item, i) => {
            table.push([
              i + 1,
              item.id,
              item.description.substring(0, 40),
              item.type,
            ]);
          });
          console.log(table.toString());
        });
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });

  exercise
    .command("log <exerciseId>")
    .description("Log an exercise")
    .option("--duration <minutes>", "Duration in minutes", "30")
    .option("--calories <cal>", "Calories burned (optional)")
    .option("--date <date>", "Date (YYYY-MM-DD)", todayStr())
    .option("--json", "Output as JSON")
    .action(async (exerciseId: string, opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in.", opts.json);
          return;
        }
        const client = new MFPClient(config);
        const entry = await client.logExercise({
          exercise_id: exerciseId,
          duration_minutes: parseInt(opts.duration),
          calories_burned: opts.calories
            ? parseInt(opts.calories)
            : undefined,
          date: opts.date,
        });
        outputResult(entry, opts.json, () => {
          console.log(
            `Logged: ${entry.name} for ${entry.duration_minutes}min (${entry.calories_burned} cal burned)`
          );
        });
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });
}
