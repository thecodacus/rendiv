#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';
import { execSync } from 'node:child_process';

const thisDir = path.dirname(fileURLToPath(import.meta.url));
const templateDir = path.resolve(thisDir, 'template');

function detectPackageManager(): string {
  const agent = process.env.npm_config_user_agent ?? '';
  if (agent.startsWith('pnpm')) return 'pnpm';
  if (agent.startsWith('yarn')) return 'yarn';
  if (agent.startsWith('bun')) return 'bun';
  return 'npm';
}

function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function copyDir(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function create(projectName: string): Promise<void> {
  const targetDir = path.resolve(process.cwd(), projectName);
  const dirName = path.basename(targetDir);

  if (fs.existsSync(targetDir)) {
    console.error(chalk.red(`Error: Directory "${dirName}" already exists.`));
    process.exit(1);
  }

  console.log();
  console.log(chalk.bold(`Creating a new Rendiv project in ${chalk.cyan(targetDir)}`));
  console.log();

  // Copy template files
  copyDir(templateDir, targetDir);

  // Process package.json template
  const tmplPath = path.join(targetDir, 'package.json.tmpl');
  const pkgContent = fs.readFileSync(tmplPath, 'utf-8').replace(/\{\{PROJECT_NAME\}\}/g, dirName);
  fs.writeFileSync(path.join(targetDir, 'package.json'), pkgContent);
  fs.unlinkSync(tmplPath);

  // Install dependencies
  const pm = detectPackageManager();
  console.log(chalk.gray(`Installing dependencies with ${pm}...`));
  console.log();

  try {
    execSync(`${pm} install`, { cwd: targetDir, stdio: 'inherit' });
  } catch {
    console.log();
    console.log(chalk.yellow('Could not install dependencies automatically.'));
    console.log(chalk.yellow(`Run ${chalk.bold(`cd ${dirName} && ${pm} install`)} manually.`));
    console.log();
  }

  // Success message
  console.log();
  console.log(chalk.green('Done!') + ' Your Rendiv project is ready.');
  console.log();
  console.log('  Next steps:');
  console.log();
  console.log(chalk.cyan(`  cd ${dirName}`));
  console.log(chalk.cyan(`  ${pm === 'npm' ? 'npx' : pm} rendiv studio src/index.tsx`));
  console.log();
  console.log('  Other commands:');
  console.log();
  console.log(`  ${chalk.gray(`${pm} run preview`)}      Preview in browser`);
  console.log(`  ${chalk.gray(`${pm} run render`)}       Render to MP4`);
  console.log(`  ${chalk.gray(`${pm} run still`)}        Export a single frame`);
  console.log();
}

const program = new Command();

program
  .name('create-rendiv')
  .description('Create a new Rendiv video project')
  .version('0.1.0')
  .argument('[project-name]', 'Name for the new project')
  .action(async (name?: string) => {
    let projectName = name;

    if (!projectName) {
      projectName = await prompt('Project name: ');
    }

    if (!projectName) {
      console.error(chalk.red('Error: Project name is required.'));
      process.exit(1);
    }

    await create(projectName);
  });

program.parse();
