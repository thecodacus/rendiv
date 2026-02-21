import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { generateStudioEntryCode, generateStudioHtml, FAVICON_SVG } from './studio-entry-code.js';
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

const STUDIO_DIR = '.studio';
const ENTRY_FILE = 'entry.tsx';
const HTML_FILE = 'studio.html';
const FAVICON_FILE = 'favicon.svg';

export async function startStudio(options: StudioOptions): Promise<StudioResult> {
  const { entryPoint, port = 3000, publicDir = 'public' } = options;

  const cwd = process.cwd();
  const absoluteEntry = path.isAbsolute(entryPoint)
    ? entryPoint
    : path.resolve(cwd, entryPoint);

  // Locate the ui/ directory shipped with this package
  const thisDir = path.dirname(fileURLToPath(import.meta.url));
  const studioUiDir = path.resolve(thisDir, '..', 'ui');

  // Generate and write temp entry files under .studio/
  const studioDir = path.join(cwd, STUDIO_DIR);
  fs.mkdirSync(studioDir, { recursive: true });

  const studioEntryFile = `${STUDIO_DIR}/${ENTRY_FILE}`;
  const studioHtmlFile = `${STUDIO_DIR}/${HTML_FILE}`;
  const studioFaviconFile = `${STUDIO_DIR}/${FAVICON_FILE}`;

  const entryCode = generateStudioEntryCode(absoluteEntry, studioUiDir, entryPoint);
  const htmlCode = generateStudioHtml(studioEntryFile, studioFaviconFile);

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
      rendivStudioPlugin({ studioHtmlFileName: studioHtmlFile, entryPoint: absoluteEntry }),
    ],
    resolve: {
      // Force Vite to resolve these packages from the user's project root,
      // not from the studio UI files' location (which is outside the project).
      dedupe: ['react', 'react-dom', '@rendiv/core', '@rendiv/player', '@rendiv/transitions', '@rendiv/noise'],
    },
    server: {
      port,
      open: true,
    },
    optimizeDeps: {
      entries: [studioEntryFile],
      exclude: ['@rendiv/core', '@rendiv/player', '@rendiv/transitions', '@rendiv/noise'],
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
