#!/usr/bin/env node
import { Command } from "commander";

const program = new Command();

program
  .name("mfp")
  .description("CLI for MyFitnessPal")
  .version("0.1.0");

program.parse();
