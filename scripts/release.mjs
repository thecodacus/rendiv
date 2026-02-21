#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── Utilities ──────────────────────────────────────────────

function exec(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf8' });
}

function run(cmd) {
  execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
}

function log(msg) {
  console.log(`\x1b[32m✓\x1b[0m ${msg}`);
}

function warn(msg) {
  console.log(`\x1b[33m⚠\x1b[0m ${msg}`);
}

function error(msg) {
  console.error(`\x1b[31m✗\x1b[0m ${msg}`);
}

function die(msg) {
  error(msg);
  process.exit(1);
}

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

// ── Argument Parsing ───────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const skipTests = args.includes('--skip-tests');
const tagIdx = args.indexOf('--tag');
const npmTag = tagIdx !== -1 ? args[tagIdx + 1] : 'latest';
const versionArg = args.find(
  (a) => !a.startsWith('--') && (tagIdx === -1 || args.indexOf(a) !== tagIdx + 1),
);

if (!versionArg) {
  console.log(`
Usage: node scripts/release.mjs <patch|minor|major|x.y.z> [options]

Options:
  --dry-run      Preview changes without publishing
  --skip-tests   Skip the test step
  --tag <tag>    npm dist-tag (default: "latest")

Examples:
  pnpm release:patch
  pnpm release:minor
  node scripts/release.mjs 1.0.0 --dry-run
  node scripts/release.mjs 1.0.0-beta.1 --tag beta
`);
  process.exit(1);
}

// ── Version Helpers ────────────────────────────────────────

function bumpVersion(current, type) {
  const [major, minor, patch] = current.split('.').map(Number);
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(`Unknown bump type: ${type}`);
  }
}

function isValidVersion(v) {
  return /^\d+\.\d+\.\d+(-[\w.]+)?$/.test(v);
}

// ── Package Discovery ──────────────────────────────────────

function getPublishablePackages() {
  const packagesDir = join(ROOT, 'packages');
  const dirs = readdirSync(packagesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const packages = [];
  for (const dir of dirs) {
    const pkgPath = join(packagesDir, dir, 'package.json');
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
      if (!pkg.private) {
        packages.push({
          name: pkg.name,
          dir: join(packagesDir, dir),
          pkgPath,
          currentVersion: pkg.version,
        });
      }
    } catch {
      // skip dirs without package.json
    }
  }
  return packages;
}

// ── Topological Sort ───────────────────────────────────────

function sortByDependencyOrder(packages) {
  const nameSet = new Set(packages.map((p) => p.name));
  const depMap = new Map();

  for (const pkg of packages) {
    const json = JSON.parse(readFileSync(pkg.pkgPath, 'utf8'));
    const allDeps = { ...json.dependencies, ...json.peerDependencies };
    const internalDeps = Object.keys(allDeps).filter((d) => nameSet.has(d));
    depMap.set(pkg.name, internalDeps);
  }

  const sorted = [];
  const visited = new Set();
  const byName = new Map(packages.map((p) => [p.name, p]));

  function visit(name) {
    if (visited.has(name)) return;
    visited.add(name);
    for (const dep of depMap.get(name) || []) {
      visit(dep);
    }
    sorted.push(byName.get(name));
  }

  for (const pkg of packages) visit(pkg.name);
  return sorted;
}

// ── Pre-flight Checks ──────────────────────────────────────

function preflight(packages) {
  // Clean working tree
  const status = exec('git status --porcelain').trim();
  if (status) {
    die('Working tree is not clean. Commit or stash changes first.\n' + status);
  }

  // Branch check
  const branch = exec('git branch --show-current').trim();
  if (branch !== 'main') {
    warn(`On branch "${branch}" (not "main").`);
  }

  // npm auth
  try {
    const user = exec('npm whoami').trim();
    log(`Logged in to npm as: ${user}`);
  } catch {
    die('Not logged in to npm. Run "npm login" first.');
  }

  // Version consistency
  const versions = new Set(packages.map((p) => p.currentVersion));
  if (versions.size > 1) {
    die('Packages have inconsistent versions: ' + [...versions].join(', '));
  }
}

// ── Main ───────────────────────────────────────────────────

async function main() {
  const packages = getPublishablePackages();

  if (packages.length === 0) {
    die('No publishable packages found.');
  }

  // Pre-flight
  if (!dryRun) {
    preflight(packages);
  }

  // Compute new version
  const currentVersion = packages[0].currentVersion;
  let newVersion;

  if (['patch', 'minor', 'major'].includes(versionArg)) {
    newVersion = bumpVersion(currentVersion, versionArg);
  } else if (isValidVersion(versionArg)) {
    newVersion = versionArg;
  } else {
    die(`Invalid version argument: "${versionArg}". Use patch, minor, major, or an explicit semver.`);
  }

  // Summary
  console.log(`
  Release Summary
  ───────────────────────────────────
  Current version:  ${currentVersion}
  New version:      ${newVersion}
  Packages (${packages.length}):     ${packages.map((p) => p.name).join(', ')}
  npm tag:          ${npmTag}
  Dry run:          ${dryRun ? 'yes' : 'no'}
  Skip tests:       ${skipTests ? 'yes' : 'no'}
  ───────────────────────────────────
`);

  if (dryRun) {
    log('[dry-run] No changes were made.');
    return;
  }

  const answer = await ask('Proceed? [y/N] ');
  if (answer !== 'y') {
    die('Aborted.');
  }

  // Bump versions
  log('Bumping versions...');
  for (const pkg of packages) {
    const content = readFileSync(pkg.pkgPath, 'utf8');
    const json = JSON.parse(content);
    json.version = newVersion;
    writeFileSync(pkg.pkgPath, JSON.stringify(json, null, 2) + '\n');
    log(`  ${pkg.name}: ${currentVersion} → ${newVersion}`);
  }

  const sorted = sortByDependencyOrder(packages);
  const published = [];

  try {
    // Build
    log('Building all packages...');
    run('pnpm build');
    log('Build succeeded.');

    // Test
    if (skipTests) {
      warn('Skipping tests (--skip-tests).');
    } else {
      log('Running tests...');
      run('pnpm test');
      log('Tests passed.');
    }

    // Publish
    log(`Publishing ${sorted.length} packages...`);
    for (const pkg of sorted) {
      log(`  Publishing ${pkg.name}@${newVersion}...`);
      execSync(`pnpm publish --access public --tag ${npmTag} --no-git-checks`, {
        cwd: pkg.dir,
        stdio: 'inherit',
      });
      published.push(pkg.name);
    }
    log(`All ${published.length} packages published.`);

    // Git commit + tag
    log('Creating git commit and tag...');
    run('git add packages/*/package.json');
    execSync(`git commit -m "release: v${newVersion}"`, { cwd: ROOT, stdio: 'inherit' });
    execSync(`git tag -a v${newVersion} -m "v${newVersion}"`, { cwd: ROOT, stdio: 'inherit' });
    log(`Tagged v${newVersion}`);

    console.log(`
  Release v${newVersion} complete!
  Run: git push && git push --tags
`);
  } catch (err) {
    error('Release failed: ' + err.message);

    if (published.length > 0) {
      warn('The following packages were already published:');
      for (const name of published) {
        warn(`  - ${name}@${newVersion}`);
      }
      warn('You can unpublish within 72 hours: npm unpublish <pkg>@<version>');
    }

    log('Reverting version changes...');
    try {
      execSync('git checkout -- packages/*/package.json', { cwd: ROOT });
      log('Version changes reverted.');
    } catch {
      error('Failed to revert. Manually run: git checkout -- packages/*/package.json');
    }

    process.exit(1);
  }
}

main();
