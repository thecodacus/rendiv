import path from 'node:path';
import fs from 'node:fs';
import { startStudio } from './start-studio.js';
import { startWorkspacePicker } from './workspace-picker-server.js';

export interface WorkspaceOptions {
  workspaceDir: string;
  port?: number;
  host?: string;
}

export interface WorkspaceResult {
  url: string;
  close: () => Promise<void>;
}

/**
 * Find the entry point for a Rendiv project.
 * Checks src/index.tsx first, then parses package.json scripts.
 */
function findEntryPoint(projectDir: string): string {
  // Check common default
  if (fs.existsSync(path.join(projectDir, 'src', 'index.tsx'))) {
    return path.join(projectDir, 'src', 'index.tsx');
  }

  // Check package.json scripts for "rendiv studio <entry>"
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(projectDir, 'package.json'), 'utf-8'));
    const studioScript = pkg.scripts?.studio;
    if (studioScript) {
      const match = studioScript.match(/rendiv\s+studio\s+(\S+)/);
      if (match) return path.join(projectDir, match[1]);
    }
  } catch {
    // ignore
  }

  // Fallback
  return path.join(projectDir, 'src', 'index.tsx');
}

/**
 * Start Studio in workspace mode.
 * Manages the lifecycle of switching between the workspace picker and individual project studios.
 * All servers run on the same port — only one is active at a time.
 */
export async function startStudioWorkspace(options: WorkspaceOptions): Promise<WorkspaceResult> {
  const { workspaceDir, port = 3000, host } = options;

  let currentClose: (() => Promise<void>) | null = null;
  let switching = false;
  let firstLaunch = true;

  async function switchTo(projectPath: string | null): Promise<void> {
    if (switching) return;
    switching = true;

    try {
      // Close the current server
      if (currentClose) {
        await currentClose();
        currentClose = null;
      }

      if (projectPath) {
        // Start project Studio
        const entryPoint = findEntryPoint(projectPath);
        const originalCwd = process.cwd();
        process.chdir(projectPath);

        try {
          const result = await startStudio({
            entryPoint,
            port,
            host,
            workspaceDir,
            onSwitchProject: (p: string | null) => switchTo(p),
          });
          currentClose = result.close;
        } catch (err) {
          // If project Studio fails, fall back to workspace picker
          process.chdir(originalCwd);
          const result = await startWorkspacePicker({
            workspaceDir,
            port,
            host,
            onSwitchProject: (p: string | null) => switchTo(p),
            openBrowser: false,
          });
          currentClose = result.close;
        }
      } else {
        // Start workspace picker
        // Ensure CWD is the workspace dir
        process.chdir(workspaceDir);

        const result = await startWorkspacePicker({
          workspaceDir,
          port,
          host,
          onSwitchProject: (p: string | null) => switchTo(p),
          openBrowser: firstLaunch,
        });
        currentClose = result.close;
      }
    } finally {
      switching = false;
    }
  }

  // Start with workspace picker
  await switchTo(null);
  firstLaunch = false;

  const url = `http://localhost:${port}`;

  return {
    url,
    close: async () => {
      if (currentClose) {
        await currentClose();
        currentClose = null;
      }
    },
  };
}
