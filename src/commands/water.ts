import { Command } from "commander";
import { MFPClient } from "../client/index.js";
import { loadAuth } from "../utils/config.js";
import { outputResult, outputError, todayStr } from "../utils/output.js";

export function registerWaterCommand(program: Command): void {
  program
    .command("water [cups]")
    .description("Log or view water intake (cups)")
    .option("--date <date>", "Date (YYYY-MM-DD)", todayStr())
    .option("--json", "Output as JSON")
    .action(async (cups: string | undefined, opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in.", opts.json);
          return;
        }
        const client = new MFPClient(config);

        if (cups) {
          const entry = await client.logWater(parseFloat(cups), opts.date);
          outputResult(entry, opts.json, () => {
            console.log(`Logged: ${cups} cups of water on ${opts.date}`);
          });
        } else {
          const entry = await client.readWater(opts.date);
          outputResult(entry, opts.json, () => {
            console.log(
              `Water today: ${entry.cups} cups (${entry.milliliters} ml)`
            );
          });
        }
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });
}
