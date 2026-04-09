import { Command } from "commander";
import { MFPClient } from "../client/index.js";
import { loadAuth } from "../utils/config.js";
import { outputResult, outputError, createTable, todayStr } from "../utils/output.js";
import type { MeasurementEntry } from "../client/types.js";

export function registerWeightCommand(program: Command): void {
  program
    .command("weight [value]")
    .description("Record or view weight (kg)")
    .option("--date <date>", "Date (YYYY-MM-DD)", todayStr())
    .option("--history", "Show weight history")
    .option("--limit <n>", "Number of entries to show", "10")
    .option("--json", "Output as JSON")
    .action(async (value: string | undefined, opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in.", opts.json);
          return;
        }
        const client = new MFPClient(config);

        if (value) {
          const entry = await client.upsertMeasurement({
            type: "Weight",
            value: parseFloat(value),
            unit: "kg",
            date: opts.date,
          });
          outputResult(entry, opts.json, () => {
            console.log(`Recorded: ${value} kg on ${opts.date}`);
          });
        } else {
          const measurements = await client.getMeasurements();
          const weights = measurements
            .filter(
              (m: MeasurementEntry) =>
                m.type === "Weight" || m.type === "weight"
            )
            .sort(
              (a: MeasurementEntry, b: MeasurementEntry) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );

          const limit = opts.history ? parseInt(opts.limit) : 1;
          const display = weights.slice(0, limit);

          outputResult(
            display,
            opts.json,
            (entries: MeasurementEntry[]) => {
              if (entries.length === 0) {
                console.log("No weight records found.");
                return;
              }
              if (!opts.history) {
                const latest = entries[0];
                console.log(
                  `Latest: ${latest.value} ${latest.unit} (${latest.date})`
                );
                return;
              }
              const table = createTable(["Date", "Weight (kg)", "Change"]);
              entries.forEach((e: MeasurementEntry, i: number) => {
                const prev = entries[i + 1];
                const change = prev
                  ? `${e.value - prev.value >= 0 ? "+" : ""}${(e.value - prev.value).toFixed(1)}`
                  : "-";
                table.push([e.date, e.value, change]);
              });
              console.log(table.toString());
            }
          );
        }
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });
}
