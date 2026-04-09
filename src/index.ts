#!/usr/bin/env node
import { Command } from "commander";
import { registerAuthCommands } from "./commands/auth.js";
import { registerSearchCommand } from "./commands/search.js";
import { registerDiaryCommand } from "./commands/diary.js";
import { registerLogCommand } from "./commands/log.js";
import { registerWeightCommand } from "./commands/weight.js";
import { registerWaterCommand } from "./commands/water.js";
import { registerExerciseCommand } from "./commands/exercise.js";
import { registerGoalsCommand } from "./commands/goals.js";
import { registerFoodCommand } from "./commands/food.js";
import { registerMealsCommand } from "./commands/meals.js";
import { registerAccountCommand } from "./commands/account.js";

const program = new Command();

program
  .name("mfp")
  .description("CLI for MyFitnessPal")
  .version("0.1.0");

registerAuthCommands(program);
registerSearchCommand(program);
registerDiaryCommand(program);
registerLogCommand(program);
registerWeightCommand(program);
registerWaterCommand(program);
registerExerciseCommand(program);
registerGoalsCommand(program);
registerFoodCommand(program);
registerMealsCommand(program);
registerAccountCommand(program);

program.parse();
