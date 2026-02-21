import { build, type InlineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { generateRenderEntryCode } from './render-entry-code.js';

export interface BundleOptions {
  entryPoint: string;
  outDir?: string;
  publicDir?: string;
  onProgress?: (progress: number) => void;
  viteConfigOverride?: (config: InlineConfig) => InlineConfig;
}

export async function bundle(options: BundleOptions): Promise<string> {
  const {
    entryPoint,
    publicDir = 'public',
    onProgress,
  } = options;

  const outDir = options.outDir ?? path.join(os.tmpdir(), `rendiv-bundle-${Date.now()}`);
  const cwd = process.cwd();
  const absoluteEntry = path.isAbsolute(entryPoint)
    ? entryPoint
    : path.resolve(cwd, entryPoint);

  // Read timeline overrides from .studio/ if they exist
  let timelineOverrides: Record<string, unknown> | undefined;
  const overridesFile = path.join(cwd, '.studio', 'timeline-overrides.json');
  try {
    const raw = fs.readFileSync(overridesFile, 'utf-8');
    timelineOverrides = JSON.parse(raw);
  } catch {
    // No overrides file — skip
  }

  // Generate the render entry code
  const renderEntryCode = generateRenderEntryCode(absoluteEntry, timelineOverrides);

  // Write temp files in the project directory so Vite resolves modules correctly
  const entryJsPath = path.join(cwd, '__rendiv_entry__.jsx');
  const entryHtmlPath = path.join(cwd, '__rendiv_entry__.html');

  fs.writeFileSync(entryJsPath, renderEntryCode);

  fs.writeFileSync(
    entryHtmlPath,
    `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #root { width: 100%; height: 100%; overflow: hidden; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="./__rendiv_entry__.jsx"></script>
</body>
</html>`
  );

  onProgress?.(0.1);

  try {
    let viteConfig: InlineConfig = {
      root: cwd,
      base: './',
      publicDir: path.resolve(cwd, publicDir),
      build: {
        outDir,
        emptyOutDir: true,
        rollupOptions: {
          input: entryHtmlPath,
        },
        minify: false,
        sourcemap: false,
      },
      plugins: [react()],
      logLevel: 'warn',
    };

    if (options.viteConfigOverride) {
      viteConfig = options.viteConfigOverride(viteConfig);
    }

    onProgress?.(0.3);

    await build(viteConfig);

    onProgress?.(0.9);

    // Rename the output HTML to index.html
    const outputHtmlPath = path.join(outDir, '__rendiv_entry__.html');
    const targetHtmlPath = path.join(outDir, 'index.html');
    if (fs.existsSync(outputHtmlPath)) {
      fs.renameSync(outputHtmlPath, targetHtmlPath);
    }

    onProgress?.(1.0);
  } finally {
    // Clean up temp files
    if (fs.existsSync(entryJsPath)) fs.unlinkSync(entryJsPath);
    if (fs.existsSync(entryHtmlPath)) fs.unlinkSync(entryHtmlPath);
  }

  return outDir;
}
