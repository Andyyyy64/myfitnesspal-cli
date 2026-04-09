import { Command } from "commander";
import { MFPClient } from "../client/index.js";
import { loadAuth } from "../utils/config.js";
import { outputResult, outputError, createTable } from "../utils/output.js";
import type { FoodItem } from "../client/types.js";

export function registerSearchCommand(program: Command): void {
  program
    .command("search <query>")
    .description("Search for foods")
    .option("--page <n>", "Page number", "0")
    .option("--per-page <n>", "Results per page", "10")
    .option("--json", "Output as JSON")
    .action(async (query: string, opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in. Run `mfp login` first.", opts.json);
          return;
        }

        const client = new MFPClient(config);
        const result = await client.searchFood(
          query,
          parseInt(opts.page),
          parseInt(opts.perPage)
        );

        outputResult(result, opts.json, ({ items }) => {
          if (items.length === 0) {
            console.log("No results found.");
            return;
          }
          const table = createTable(["#", "ID", "Name", "Brand", "Cal", "P", "C", "F"]);
          items.forEach((item: FoodItem, i: number) => {
            const nc = item.nutritional_contents;
            table.push([
              i + 1,
              item.id,
              item.description.substring(0, 30),
              (item.brand || "-").substring(0, 15),
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
}
