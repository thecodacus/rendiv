#!/usr/bin/env node
import { Command } from 'commander';
import { renderCommand } from './commands/render.js';
import { stillCommand } from './commands/still.js';
import { compositionsCommand } from './commands/compositions.js';
import { studioCommand } from './commands/studio.js';
import { upgradeCommand } from './commands/upgrade.js';

const program = new Command();

program
  .name('rendiv')
  .description('Rendiv - Create videos programmatically with React')
  .version('0.1.0');

program.addCommand(renderCommand);
program.addCommand(stillCommand);
program.addCommand(compositionsCommand);
program.addCommand(studioCommand);
program.addCommand(upgradeCommand);

program.parse();
