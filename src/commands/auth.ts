import { Command } from "commander";
import inquirer from "inquirer";
import { MFPClient } from "../client/index.js";
import { loadAuth, saveAuth } from "../utils/config.js";
import { outputResult, outputError } from "../utils/output.js";

export function registerAuthCommands(program: Command): void {
  program
    .command("login")
    .description("Login with email and password")
    .option("--email <email>", "MyFitnessPal email")
    .option("--password <password>", "MyFitnessPal password")
    .option("--json", "Output as JSON")
    .action(async (opts) => {
      try {
        let { email, password } = opts;
        if (!email || !password) {
          const answers = await inquirer.prompt([
            ...(!email
              ? [{ type: "input", name: "email", message: "Email:" }]
              : []),
            ...(!password
              ? [{ type: "password", name: "password", message: "Password:" }]
              : []),
          ]);
          email = email || answers.email;
          password = password || answers.password;
        }

        const { sessionToken } = await MFPClient.login(email, password);
        const config = { sessionToken };
        await saveAuth(config);

        // Verify and get user info
        const client = new MFPClient(config);
        const session = await client.getSession();
        await saveAuth({ ...config, userId: session.userId });

        outputResult(
          { message: "Login successful", userId: session.userId, email: session.email },
          opts.json
        );
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });

  const auth = program
    .command("auth")
    .description("Authentication management");

  auth
    .command("set-cookie <token>")
    .description("Manually set session cookie")
    .option("--json", "Output as JSON")
    .action(async (token: string, opts) => {
      try {
        const config = { sessionToken: token };
        await saveAuth(config);

        // Verify the token
        const client = new MFPClient(config);
        const session = await client.getSession();
        await saveAuth({ ...config, userId: session.userId });

        outputResult(
          { message: "Cookie saved and verified", userId: session.userId },
          opts.json
        );
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });

  auth
    .command("status")
    .description("Check authentication status")
    .option("--json", "Output as JSON")
    .action(async (opts) => {
      try {
        const config = await loadAuth();
        if (!config) {
          outputError("Not logged in. Run `mfp login` or `mfp auth set-cookie`.", opts.json);
          return;
        }
        const client = new MFPClient(config);
        const session = await client.getSession();
        outputResult(session, opts.json, (s) => {
          console.log(`Logged in as: ${s.email}`);
          console.log(`User ID: ${s.userId}`);
          console.log(`Tier: ${s.tier}`);
          console.log(`Country: ${s.country}`);
        });
      } catch (err) {
        outputError((err as Error).message, opts.json);
      }
    });
}
