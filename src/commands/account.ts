import { Command } from "commander";
import { MFPClient } from "../client/index.js";
import { loadAuth } from "../utils/config.js";
import { outputResult, outputError, createTable, todayStr } from "../utils/output.js";

export function registerAccountCommand(program: Command): void {
  const account = program.command("account").description("Account and settings management");

  account
    .command("profile")
    .description("View user profile")
    .option("--json", "Output as JSON")
    .action(async (opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in.", opts.json);
          return;
        }
        const client = new MFPClient(config);
        const profile = await client.getUserProfile();
        outputResult(profile, opts.json, (p: unknown) => {
          const data = p as Record<string, unknown>;
          const table = createTable(["Field", "Value"]);
          for (const [key, value] of Object.entries(data)) {
            if (typeof value !== "object" || value === null) {
              table.push([key, String(value ?? "")]);
            }
          }
          console.log(table.toString());
        });
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });

  account
    .command("settings")
    .description("View diary settings")
    .option("--json", "Output as JSON")
    .action(async (opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in.", opts.json);
          return;
        }
        const client = new MFPClient(config);
        const settings = await client.getDiarySettings();
        outputResult(settings, opts.json, (s: unknown) => {
          const data = s as Record<string, unknown>;
          const table = createTable(["Setting", "Value"]);
          for (const [key, value] of Object.entries(data)) {
            if (typeof value !== "object" || value === null) {
              table.push([key, String(value ?? "")]);
            }
          }
          console.log(table.toString());
        });
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });

  account
    .command("digest")
    .description("Show weekly digest/summary")
    .option("--from <date>", "Start date (YYYY-MM-DD)")
    .option("--to <date>", "End date (YYYY-MM-DD)")
    .option("--json", "Output as JSON")
    .action(async (opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in.", opts.json);
          return;
        }
        const client = new MFPClient(config);

        const toDate = opts.to ?? todayStr();
        const fromDate = opts.from ?? (() => {
          const d = new Date(toDate);
          d.setDate(d.getDate() - 6);
          return d.toISOString().split("T")[0];
        })();

        const digest = await client.getWeeklyDigest(fromDate, toDate);
        outputResult(digest, opts.json, (d: unknown) => {
          const data = d as Record<string, unknown>;
          console.log(`Digest: ${fromDate} to ${toDate}`);
          const table = createTable(["Metric", "Value"]);
          for (const [key, value] of Object.entries(data)) {
            if (typeof value !== "object" || value === null) {
              table.push([key, String(value ?? "")]);
            }
          }
          if (table.length > 0) {
            console.log(table.toString());
          } else {
            console.log(JSON.stringify(data, null, 2));
          }
        });
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });

  account
    .command("update")
    .description("Update user profile")
    .option("--username <name>", "Update username")
    .option("--data <json>", "Raw JSON data to update")
    .option("--json", "Output as JSON")
    .action(async (opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in.", opts.json);
          return;
        }
        const updates: Record<string, unknown> = {};
        if (opts.username) updates.username = opts.username;
        if (opts.data) {
          const parsed = JSON.parse(opts.data) as Record<string, unknown>;
          Object.assign(updates, parsed);
        }
        if (Object.keys(updates).length === 0) {
          outputError("No updates specified. Use --username or --data.", opts.json);
          return;
        }
        const client = new MFPClient(config);
        const result = await client.updateUserProfile(updates);
        outputResult(result, opts.json, (data: unknown) => {
          console.log("Profile updated.");
          const record = data as Record<string, unknown>;
          const table = createTable(["Field", "Value"]);
          for (const [key, value] of Object.entries(record)) {
            if (typeof value !== "object" || value === null) {
              table.push([key, String(value ?? "")]);
            }
          }
          if (table.length > 0) console.log(table.toString());
        });
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });

  account
    .command("update-settings")
    .description("Update diary settings")
    .option("--data <json>", "Raw JSON data to update")
    .option("--json", "Output as JSON")
    .action(async (opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in.", opts.json);
          return;
        }
        if (!opts.data) {
          outputError("--data <json> is required.", opts.json);
          return;
        }
        const settings = JSON.parse(opts.data) as Record<string, unknown>;
        const client = new MFPClient(config);
        const result = await client.updateDiarySettings(settings);
        outputResult(result, opts.json, (data: unknown) => {
          console.log("Diary settings updated.");
          const record = data as Record<string, unknown>;
          const table = createTable(["Setting", "Value"]);
          for (const [key, value] of Object.entries(record)) {
            if (typeof value !== "object" || value === null) {
              table.push([key, String(value ?? "")]);
            }
          }
          if (table.length > 0) console.log(table.toString());
        });
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });

  account
    .command("diary-profile")
    .description("View diary profile")
    .option("--json", "Output as JSON")
    .action(async (opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in.", opts.json);
          return;
        }
        const client = new MFPClient(config);
        const profile = await client.getDiaryProfile();
        outputResult(profile, opts.json, (data: unknown) => {
          console.log(JSON.stringify(data, null, 2));
        });
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });

  account
    .command("report <type> <name> <length>")
    .description("Get a report (e.g. mfp account report net calories 30)")
    .option("--json", "Output as JSON")
    .action(async (type: string, name: string, length: string, opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in.", opts.json);
          return;
        }
        const client = new MFPClient(config);
        const result = await client.getReport(type, name, length);
        outputResult(result, opts.json, (data: unknown) => {
          console.log(JSON.stringify(data, null, 2));
        });
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });

  account
    .command("export")
    .description("Request data export from MyFitnessPal")
    .option("--json", "Output as JSON")
    .action(async (opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in.", opts.json);
          return;
        }
        const client = new MFPClient(config);
        const result = await client.requestDataExport();
        outputResult(result, opts.json, () => {
          console.log("Data export requested. You will receive an email when it is ready.");
        });
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });
}
