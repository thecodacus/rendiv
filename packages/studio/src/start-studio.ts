import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { generateStudioEntryCode, generateStudioHtml, generateStudioGlobals, FAVICON_SVG } from './studio-entry-code.js';
import { rendivStudioPlugin } from './vite-plugin-studio.js';

const studioRequire = createRequire(import.meta.url);

export interface StudioOptions {
  entryPoint: string;
  port?: number;
  host?: string;
  publicDir?: string;
  /** When set, Studio is workspace-aware and shows a "Back to projects" button. */
  workspaceDir?: string;
  /** Callback to switch projects. Called with project path or null (back to picker). */
  onSwitchProject?: (projectPath: string | null) => void;
}

export interface StudioResult {
  url: string;
  close: () => Promise<void>;
}

const STUDIO_DIR = '.studio';
const ENTRY_FILE = 'entry.tsx';
const HTML_FILE = 'studio.html';
const FAVICON_FILE = 'favicon.svg';

export async function startStudio(options: StudioOptions): Promise<StudioResult> {
  const { entryPoint, port = 3000, host, publicDir = 'public', workspaceDir, onSwitchProject } = options;

  const cwd = process.cwd();
  const absoluteEntry = path.isAbsolute(entryPoint)
    ? entryPoint
    : path.resolve(cwd, entryPoint);

  // Locate the ui/ directory shipped with this package
  const thisDir = path.dirname(fileURLToPath(import.meta.url));
  const studioUiDir = path.resolve(thisDir, '..', 'ui');

  // Resolve @xterm/* from the studio package's own dep tree. The user's project
  // doesn't list these directly, and under pnpm they aren't hoisted to the cwd
  // node_modules — so we must point Vite at them explicitly via resolve.alias.
  const xtermXtermEntry = studioRequire.resolve('@xterm/xterm');
  const xtermAddonFitEntry = studioRequire.resolve('@xterm/addon-fit');
  const xtermXtermCss = studioRequire.resolve('@xterm/xterm/css/xterm.css');

  // Generate and write temp entry files under .studio/
  const studioDir = path.join(cwd, STUDIO_DIR);
  fs.mkdirSync(studioDir, { recursive: true });

  const studioEntryFile = `${STUDIO_DIR}/${ENTRY_FILE}`;
  const studioHtmlFile = `${STUDIO_DIR}/${HTML_FILE}`;
  const studioFaviconFile = `${STUDIO_DIR}/${FAVICON_FILE}`;

  const entryCode = generateStudioEntryCode(absoluteEntry, studioUiDir, entryPoint);
  const globalsScript = generateStudioGlobals(entryPoint, workspaceDir);
  const htmlCode = generateStudioHtml(studioEntryFile, studioFaviconFile, globalsScript);

  fs.writeFileSync(path.join(studioDir, ENTRY_FILE), entryCode);
  fs.writeFileSync(path.join(studioDir, HTML_FILE), htmlCode);
  fs.writeFileSync(path.join(studioDir, FAVICON_FILE), FAVICON_SVG);

  // configFile: false prevents Vite from loading the user's vite.config.ts,
  // which may already include @vitejs/plugin-react. Adding it twice causes
  // React Refresh to inject duplicate preamble declarations.
  const server = await createServer({
    configFile: false,
    root: cwd,
    publicDir: path.resolve(cwd, publicDir),
    plugins: [
      react(),
      rendivStudioPlugin({ studioHtmlFileName: studioHtmlFile, entryPoint: absoluteEntry, workspaceDir, onSwitchProject }),
    ],
    resolve: {
      // Force Vite to resolve these packages from the user's project root,
      // not from the studio UI files' location (which is outside the project).
      dedupe: ['react', 'react-dom', '@rendiv/core', '@rendiv/player', '@rendiv/transitions', '@rendiv/noise', '@rendiv/shapes', '@rendiv/paths', '@rendiv/motion-blur', '@rendiv/fonts', '@rendiv/google-fonts'],
      alias: [
        // Point Vite at the @xterm/* copies that ship with @rendiv/studio,
        // since the user's project doesn't list them and pnpm doesn't hoist them.
        { find: /^@xterm\/xterm\/css\/xterm\.css$/, replacement: xtermXtermCss },
        { find: /^@xterm\/xterm$/, replacement: xtermXtermEntry },
        { find: /^@xterm\/addon-fit$/, replacement: xtermAddonFitEntry },
      ],
    },
    server: {
      port,
      host: host || undefined,
      // Don't auto-open browser on workspace restarts or remote/Docker (--host)
      open: !onSwitchProject && !host,
      // Allow any hostname when binding to a network interface (remote/Docker)
      allowedHosts: host ? true : undefined,
      // Enable polling for Docker/remote where native fs events don't work on mounted volumes
      watch: host ? { usePolling: true, interval: 500 } : undefined,
    },
    optimizeDeps: {
      entries: [studioEntryFile],
      // Force-include deps used only inside the Studio UI (which is imported
      // via an absolute path into node_modules/@rendiv/studio/ui/ and is not
      // reached by Vite's entry-time dep scanner). Without this, UMD packages
      // like @xterm/* would be served raw and `import { FitAddon }` would fail,
      // and subpaths like react-dom/client wouldn't expose their named exports.
      include: ['@xterm/xterm', '@xterm/addon-fit', 'react-dom/client'],
      exclude: ['@rendiv/core', '@rendiv/player', '@rendiv/transitions', '@rendiv/noise', '@rendiv/shapes', '@rendiv/paths', '@rendiv/motion-blur', '@rendiv/fonts', '@rendiv/google-fonts'],
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
