import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { readFile, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
}

function parseVersion(spec: string): { prefix: string; version: string } {
  const match = spec.match(/^([~^]?)(.+)$/);
  return match ? { prefix: match[1], version: match[2] } : { prefix: '', version: spec };
}

async function detectPackageManager(cwd: string): Promise<string> {
  const lockfiles: Array<[string, string]> = [
    ['pnpm-lock.yaml', 'pnpm'],
    ['yarn.lock', 'yarn'],
    ['bun.lockb', 'bun'],
  ];
  for (const [file, pm] of lockfiles) {
    try {
      await access(join(cwd, file));
      return pm;
    } catch {
      // not found, continue
    }
  }
  return 'npm';
}

export const upgradeCommand = new Command('upgrade')
  .description('Upgrade @rendiv packages to the latest version')
  .option('--check', 'Check for updates without installing')
  .action(async (options: { check?: boolean }) => {
    const cwd = process.cwd();
    const pkgPath = join(cwd, 'package.json');

    // 1. Read package.json
    let raw: string;
    try {
      raw = await readFile(pkgPath, 'utf-8');
    } catch {
      console.error(chalk.red('Error: No package.json found in the current directory.'));
      process.exitCode = 1;
      return;
    }

    const pkg: PackageJson = JSON.parse(raw);

    // 2. Collect all @rendiv/* dependencies
    const rendivDeps: Array<{ name: string; spec: string; section: 'dependencies' | 'devDependencies' }> = [];

    for (const section of ['dependencies', 'devDependencies'] as const) {
      const deps = pkg[section];
      if (!deps) continue;
      for (const [name, spec] of Object.entries(deps)) {
        if (name.startsWith('@rendiv/')) {
          rendivDeps.push({ name, spec, section });
        }
      }
    }

    if (rendivDeps.length === 0) {
      console.log(chalk.yellow('\nNo @rendiv packages found in this project.\n'));
      return;
    }

    // 3. Fetch latest version from npm
    const spinner = ora('Checking for updates...').start();
    let latestVersion: string;
    try {
      const res = await fetch('https://registry.npmjs.org/@rendiv/core/latest');
      if (!res.ok) throw new Error(`npm registry returned ${res.status}`);
      const data = await res.json() as { version: string };
      latestVersion = data.version;
    } catch (error) {
      spinner.fail(chalk.red(`Failed to fetch latest version: ${(error as Error).message}`));
      process.exitCode = 1;
      return;
    }

    // 4. Compare versions
    const updates: Array<{ name: string; from: string; to: string; prefix: string; section: 'dependencies' | 'devDependencies' }> = [];

    for (const dep of rendivDeps) {
      const { prefix, version } = parseVersion(dep.spec);
      if (version !== latestVersion) {
        updates.push({ name: dep.name, from: version, to: latestVersion, prefix, section: dep.section });
      }
    }

    if (updates.length === 0) {
      spinner.succeed(chalk.green(`All @rendiv packages are up to date (v${latestVersion}).`));
      return;
    }

    spinner.stop();

    // 5. Show summary
    console.log(chalk.bold(`\n  @rendiv updates available: v${latestVersion}\n`));
    for (const u of updates) {
      console.log(`  ${chalk.cyan(u.name)}  ${chalk.gray(u.from)} ${chalk.gray('→')} ${chalk.green(u.to)}`);
    }
    console.log();

    if (options.check) {
      console.log(chalk.gray('  Run `rendiv upgrade` to apply updates.\n'));
      return;
    }

    // 6. Update package.json
    let updatedRaw = raw;
    for (const u of updates) {
      // Replace the version spec in the raw JSON to preserve formatting
      const oldSpec = `${u.prefix}${u.from}`;
      const newSpec = `${u.prefix}${u.to}`;
      // Match the exact dependency entry pattern: "package-name": "version"
      const pattern = new RegExp(`("${u.name.replace('/', '\\/')}"\\s*:\\s*")${oldSpec.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`);
      updatedRaw = updatedRaw.replace(pattern, `$1${newSpec}"`);
    }

    await writeFile(pkgPath, updatedRaw, 'utf-8');
    console.log(chalk.green('  Updated package.json'));

    // 7. Detect package manager and install
    const pm = await detectPackageManager(cwd);
    const installSpinner = ora(`Running ${pm} install...`).start();
    try {
      execSync(`${pm} install`, { cwd, stdio: 'pipe' });
      installSpinner.succeed(chalk.green(`Upgraded ${updates.length} package(s) to v${latestVersion}`));
    } catch (error) {
      installSpinner.fail(chalk.red(`${pm} install failed. Run it manually to complete the upgrade.`));
      process.exitCode = 1;
    }
  });
