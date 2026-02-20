import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { generateStudioEntryCode, generateStudioHtml } from './studio-entry-code.js';
import { rendivStudioPlugin } from './vite-plugin-studio.js';

export interface StudioOptions {
  entryPoint: string;
  port?: number;
  publicDir?: string;
}

export interface StudioResult {
  url: string;
  close: () => Promise<void>;
}

const ENTRY_FILE = '__rendiv_studio_entry__.tsx';
const HTML_FILE = '__rendiv_studio__.html';

export async function startStudio(options: StudioOptions): Promise<StudioResult> {
  const { entryPoint, port = 3000, publicDir = 'public' } = options;

  const cwd = process.cwd();
  const absoluteEntry = path.isAbsolute(entryPoint)
    ? entryPoint
    : path.resolve(cwd, entryPoint);

  // Locate the ui/ directory shipped with this package
  const thisDir = path.dirname(fileURLToPath(import.meta.url));
  const studioUiDir = path.resolve(thisDir, '..', 'ui');

  // Generate and write temp entry files in the project root
  const entryCode = generateStudioEntryCode(absoluteEntry, studioUiDir, entryPoint);
  const htmlCode = generateStudioHtml(ENTRY_FILE);

  const entryJsPath = path.join(cwd, ENTRY_FILE);
  const entryHtmlPath = path.join(cwd, HTML_FILE);

  fs.writeFileSync(entryJsPath, entryCode);
  fs.writeFileSync(entryHtmlPath, htmlCode);

  // configFile: false prevents Vite from loading the user's vite.config.ts,
  // which may already include @vitejs/plugin-react. Adding it twice causes
  // React Refresh to inject duplicate preamble declarations.
  const server = await createServer({
    configFile: false,
    root: cwd,
    publicDir: path.resolve(cwd, publicDir),
    plugins: [
      react(),
      rendivStudioPlugin({ studioHtmlFileName: HTML_FILE }),
    ],
    resolve: {
      // Force Vite to resolve these packages from the user's project root,
      // not from the studio UI files' location (which is outside the project).
      dedupe: ['react', 'react-dom', 'rendiv', '@rendiv/player'],
    },
    server: {
      port,
      open: true,
    },
    optimizeDeps: {
      entries: [ENTRY_FILE],
      exclude: ['rendiv', '@rendiv/player'],
    },
    logLevel: 'info',
  });

  await server.listen();

  const resolvedPort = server.config.server.port ?? port;
  const url = `http://localhost:${resolvedPort}`;

  const cleanup = () => {
    if (fs.existsSync(entryJsPath)) fs.unlinkSync(entryJsPath);
    if (fs.existsSync(entryHtmlPath)) fs.unlinkSync(entryHtmlPath);
  };

  return {
    url,
    close: async () => {
      await server.close();
      cleanup();
    },
  };
}
