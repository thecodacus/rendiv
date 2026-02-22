import { createServer, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { generateWorkspaceEntryCode, generateWorkspaceHtml, FAVICON_SVG } from './workspace-entry-code.js';
import { scaffoldProject } from './scaffold-project.js';

export interface WorkspacePickerOptions {
  workspaceDir: string;
  port: number;
  host?: string;
  onSwitchProject: (projectPath: string | null) => void;
  openBrowser?: boolean;
}

export interface WorkspacePickerResult {
  url: string;
  close: () => Promise<void>;
}

export interface WorkspaceProject {
  name: string;
  path: string;
  hasNodeModules: boolean;
  entryPoint: string;
}

const STUDIO_DIR = '.studio';
const ENTRY_FILE = 'entry.tsx';
const HTML_FILE = 'studio.html';
const FAVICON_FILE = 'favicon.svg';

/**
 * Scan workspace directory for Rendiv projects.
 * A subdirectory is a project if it has package.json with @rendiv/core in dependencies.
 */
export function scanProjects(workspaceDir: string): WorkspaceProject[] {
  const projects: WorkspaceProject[] = [];

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(workspaceDir, { withFileTypes: true });
  } catch {
    return projects;
  }

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;

    const dirPath = path.join(workspaceDir, entry.name);
    const pkgPath = path.join(dirPath, 'package.json');

    try {
      const raw = fs.readFileSync(pkgPath, 'utf-8');
      const pkg = JSON.parse(raw);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      if (!deps['@rendiv/core']) continue;

      // Detect entry point
      let entryPoint = 'src/index.tsx';
      const studioScript = pkg.scripts?.studio;
      if (studioScript) {
        const match = studioScript.match(/rendiv\s+studio\s+(\S+)/);
        if (match) entryPoint = match[1];
      }

      projects.push({
        name: entry.name,
        path: dirPath,
        hasNodeModules: fs.existsSync(path.join(dirPath, 'node_modules')),
        entryPoint,
      });
    } catch {
      // Not a valid project, skip
    }
  }

  return projects.sort((a, b) => a.name.localeCompare(b.name));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', reject);
  });
}

function jsonResponse(res: ServerResponse, data: unknown, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function workspacePickerPlugin(options: WorkspacePickerOptions): Plugin {
  const { workspaceDir, onSwitchProject } = options;
  const studioHtmlFileName = `${STUDIO_DIR}/${HTML_FILE}`;

  return {
    name: 'rendiv-workspace-picker',
    configureServer(server) {
      // Workspace API endpoints
      server.middlewares.use((req, res, next) => {
        // GET /workspace/projects — list all projects
        if (req.method === 'GET' && req.url === '/__rendiv_api__/workspace/projects') {
          const projects = scanProjects(workspaceDir);
          jsonResponse(res, { projects });
          return;
        }

        // POST /workspace/open — switch to a project
        if (req.method === 'POST' && req.url === '/__rendiv_api__/workspace/open') {
          readBody(req).then((raw) => {
            const body = JSON.parse(raw);
            const projectPath = body.path as string;

            if (!projectPath || !fs.existsSync(projectPath)) {
              jsonResponse(res, { error: 'Project path not found' }, 404);
              return;
            }

            jsonResponse(res, { status: 'switching' });

            // Delay to ensure HTTP response is flushed before server restart
            setTimeout(() => onSwitchProject(projectPath), 100);
          }).catch((err) => {
            jsonResponse(res, { error: String(err) }, 500);
          });
          return;
        }

        // POST /workspace/create — scaffold a new project
        if (req.method === 'POST' && req.url === '/__rendiv_api__/workspace/create') {
          readBody(req).then(async (raw) => {
            const body = JSON.parse(raw);
            const name = body.name as string;

            if (!name) {
              jsonResponse(res, { error: 'Project name is required' }, 400);
              return;
            }

            const result = await scaffoldProject(workspaceDir, name, (message) => {
              // Progress messages are sent via the response (not streaming for simplicity)
              // The UI polls /workspace/projects to see when the project appears
            });

            if (result.success) {
              jsonResponse(res, { status: 'created', name });
            } else {
              jsonResponse(res, { error: result.error }, 400);
            }
          }).catch((err) => {
            jsonResponse(res, { error: String(err) }, 500);
          });
          return;
        }

        next();
      });

      // Rewrite root to serve workspace picker HTML
      server.middlewares.use((req, _res, next) => {
        if (req.url === '/' || req.url === '/index.html') {
          req.url = `/${studioHtmlFileName}`;
        }
        next();
      });
    },
  };
}

/**
 * Start a minimal Vite dev server that serves the workspace picker UI.
 */
export async function startWorkspacePicker(options: WorkspacePickerOptions): Promise<WorkspacePickerResult> {
  const { workspaceDir, port, host, openBrowser = true } = options;

  // Locate the ui/ directory shipped with this package
  const thisDir = path.dirname(fileURLToPath(import.meta.url));
  const studioUiDir = path.resolve(thisDir, '..', 'ui');

  // Generate and write temp entry files under .studio/
  const studioDir = path.join(workspaceDir, STUDIO_DIR);
  fs.mkdirSync(studioDir, { recursive: true });

  const studioEntryFile = `${STUDIO_DIR}/${ENTRY_FILE}`;
  const studioFaviconFile = `${STUDIO_DIR}/${FAVICON_FILE}`;

  const entryCode = generateWorkspaceEntryCode(studioUiDir);
  const htmlCode = generateWorkspaceHtml(studioEntryFile, studioFaviconFile);

  fs.writeFileSync(path.join(studioDir, ENTRY_FILE), entryCode);
  fs.writeFileSync(path.join(studioDir, HTML_FILE), htmlCode);
  fs.writeFileSync(path.join(studioDir, FAVICON_FILE), FAVICON_SVG);

  // Resolve react/react-dom from the studio package's node_modules
  // since the workspace root may not have them installed
  const require = createRequire(import.meta.url);
  const reactPath = path.dirname(require.resolve('react/package.json'));
  const reactDomPath = path.dirname(require.resolve('react-dom/package.json'));

  const server = await createServer({
    configFile: false,
    root: workspaceDir,
    plugins: [
      react(),
      workspacePickerPlugin(options),
    ],
    server: {
      port,
      host: host || undefined,
      open: openBrowser,
      allowedHosts: host ? true : undefined,
      watch: host ? { usePolling: true, interval: 500 } : undefined,
    },
    resolve: {
      alias: {
        'react': reactPath,
        'react-dom': reactDomPath,
      },
    },
    optimizeDeps: {
      entries: [studioEntryFile],
    },
    logLevel: 'info',
  });

  await server.listen();

  const resolvedPort = server.config.server.port ?? port;
  const url = `http://localhost:${resolvedPort}`;

  const cleanup = () => {
    if (fs.existsSync(studioDir)) {
      fs.rmSync(studioDir, { recursive: true, force: true });
    }
  };

  return {
    url,
    close: async () => {
      await server.close();
      cleanup();
    },
  };
}
