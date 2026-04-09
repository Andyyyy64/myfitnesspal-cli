#!/usr/bin/env node
import { Command } from "commander";
import { registerAuthCommands } from "./commands/auth.js";

const program = new Command();

program
  .name("mfp")
  .description("CLI for MyFitnessPal")
  .version("0.1.0");

registerAuthCommands(program);

program.parse();
