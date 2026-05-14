#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderCommand } from './commands/render.js';
import { stillCommand } from './commands/still.js';
import { compositionsCommand } from './commands/compositions.js';
import { studioCommand } from './commands/studio.js';
import { upgradeCommand } from './commands/upgrade.js';

const thisDir = path.dirname(fileURLToPath(import.meta.url));
const pkgVersion = JSON.parse(
  fs.readFileSync(path.resolve(thisDir, '..', 'package.json'), 'utf8'),
).version as string;

const program = new Command();

program
  .name('rendiv')
  .description('Rendiv - Create videos programmatically with React')
  .version(pkgVersion);

program.addCommand(renderCommand);
program.addCommand(stillCommand);
program.addCommand(compositionsCommand);
program.addCommand(studioCommand);
program.addCommand(upgradeCommand);

program.parse();
