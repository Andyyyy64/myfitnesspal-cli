import { Command } from "commander";
import { MFPClient } from "../client/index.js";
import { loadAuth } from "../utils/config.js";
import { outputResult, outputError, createTable, todayStr } from "../utils/output.js";

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

  exercise
    .command("list")
    .description("List all exercises alphabetically")
    .option("--json", "Output as JSON")
    .action(async (opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in.", opts.json);
          return;
        }
        const client = new MFPClient(config);
        const results = await client.lookupExercises();
        const sorted = [...results].sort((a, b) =>
          a.description.localeCompare(b.description)
        );
        outputResult(sorted, opts.json, (items) => {
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
    .command("my-exercises")
    .description("List custom/private exercises")
    .option("--json", "Output as JSON")
    .action(async (opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in.", opts.json);
          return;
        }
        const client = new MFPClient(config);
        const results = await client.lookupPrivateExercises();
        const sorted = [...results].sort((a, b) =>
          a.description.localeCompare(b.description)
        );
        outputResult(sorted, opts.json, (items) => {
          if (items.length === 0) {
            console.log("No custom exercises found.");
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
    .command("calories <exerciseId>")
    .description("Get calories burned info for an exercise")
    .option("--json", "Output as JSON")
    .action(async (exerciseId: string, opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in.", opts.json);
          return;
        }
        const client = new MFPClient(config);
        const result = await client.getCaloriesBurned(exerciseId);
        outputResult(result, opts.json, (data) => {
          console.log(JSON.stringify(data, null, 2));
        });
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });

  exercise
    .command("get <id>")
    .description("Get exercise details by ID")
    .option("--json", "Output as JSON")
    .action(async (id: string, opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in.", opts.json);
          return;
        }
        const client = new MFPClient(config);
        const result = await client.getExerciseById(id);
        outputResult(result, opts.json, (item) => {
          const table = createTable(["Field", "Value"]);
          table.push(
            ["ID", item.id],
            ["Name", item.description],
            ["Type", item.type],
          );
          if (item.calories_per_minute !== undefined) {
            table.push(["Cal/min", String(item.calories_per_minute)]);
          }
          console.log(table.toString());
        });
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });

  exercise
    .command("delete <id>")
    .description("Delete an exercise entry")
    .option("--json", "Output as JSON")
    .action(async (id: string, opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in.", opts.json);
          return;
        }
        const client = new MFPClient(config);
        await client.deleteExercise(id);
        outputResult({ success: true, id }, opts.json, () => {
          console.log(`Deleted exercise entry ${id}.`);
        });
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });

  exercise
    .command("update <id>")
    .description("Update an exercise entry")
    .option("--duration <minutes>", "Duration in minutes")
    .option("--calories <cal>", "Calories burned")
    .option("--json", "Output as JSON")
    .action(async (id: string, opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in.", opts.json);
          return;
        }
        const updates: Record<string, unknown> = {};
        if (opts.duration) updates.duration_minutes = parseInt(opts.duration);
        if (opts.calories) updates.calories_burned = parseInt(opts.calories);
        if (Object.keys(updates).length === 0) {
          outputError("No updates specified. Use --duration or --calories.", opts.json);
          return;
        }
        const client = new MFPClient(config);
        const entry = await client.updateExercise(id, updates);
        outputResult(entry, opts.json, () => {
          console.log(
            `Updated: ${entry.name} — ${entry.duration_minutes}min, ${entry.calories_burned} cal burned`
          );
        });
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });
}
