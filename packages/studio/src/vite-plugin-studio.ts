import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { readFile, writeFile, unlink, readdir, stat as fsStat, mkdir, rename, rmdir } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { basename } from 'node:path';
import { join, resolve, relative, normalize } from 'node:path';

export interface StudioPluginOptions {
  studioHtmlFileName: string;
  entryPoint: string;
  /** When set, Studio is in workspace mode and shows workspace controls. */
  workspaceDir?: string;
  /** Callback to switch projects. Pass null to go back to workspace picker. */
  onSwitchProject?: (projectPath: string | null) => void;
}

// --- Server-side render queue state (in-memory, survives page refresh) ---

type ServerRenderJobStatus = 'queued' | 'bundling' | 'rendering' | 'encoding' | 'done' | 'error' | 'cancelled';

interface ServerRenderJob {
  id: string;
  compositionId: string;
  compositionName: string;
  codec: 'mp4' | 'webm';
  outputPath: string;
  inputProps: Record<string, unknown>;
  status: ServerRenderJobStatus;
  progress: number;
  renderedFrames: number;
  totalFrames: number;
  error?: string;
  imageFormat?: 'png' | 'jpeg';
  encodingPreset?: string;
  crf?: number;
  videoEncoder?: string;
  gl?: 'swiftshader' | 'egl' | 'angle';
  concurrency?: number;
}

let renderJobs: ServerRenderJob[] = [];
let nextJobId = 1;
let activeJobId: string | null = null;
let activeAbortController: AbortController | null = null;

// --- Server-side terminal state (in-memory, survives page refresh) ---

let terminalProcess: import('node-pty').IPty | null = null;
let terminalCols = 80;
let terminalRows = 24;

async function tryImportNodePty(): Promise<typeof import('node-pty') | null> {
  try {
    const pty = await import('node-pty');
    // Ensure spawn-helper has execute permission (pnpm may strip it)
    if (process.platform !== 'win32') {
      try {
        const { createRequire } = await import('module');
        const { resolve, dirname } = await import('path');
        const { chmodSync, statSync } = await import('fs');
        const ptyDir = dirname(createRequire(import.meta.url).resolve('node-pty'));
        const helperPath = resolve(
          ptyDir,
          'prebuilds',
          `${process.platform}-${process.arch}`,
          'spawn-helper',
        );
        const st = statSync(helperPath, { throwIfNoEntry: false });
        if (st && !(st.mode & 0o111)) {
          chmodSync(helperPath, st.mode | 0o755);
        }
      } catch {
        // Best-effort; if it fails, the spawn error will surface later
      }
    }
    return pty;
  } catch {
    return null;
  }
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', reject);
  });
}

function readRawBody(req: IncomingMessage, maxBytes: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalSize = 0;
    req.on('data', (chunk: Buffer) => {
      totalSize += chunk.length;
      if (totalSize > maxBytes) {
        req.destroy();
        reject(new Error(`File exceeds maximum size of ${Math.round(maxBytes / (1024 * 1024))}MB`));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function sanitizeFilename(name: string): string {
  let sanitized = name.replace(/[/\\:\0]/g, '');
  sanitized = sanitized.replace(/^\.+/, '');
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  if (!sanitized) sanitized = 'untitled';
  return sanitized;
}

function processQueue(entryPoint: string): void {
  if (activeJobId) return;

  const nextJob = renderJobs.find((j) => j.status === 'queued');
  if (!nextJob) return;

  activeJobId = nextJob.id;
  const abortController = new AbortController();
  activeAbortController = abortController;

  const updateJob = (updates: Partial<ServerRenderJob>) => {
    const job = renderJobs.find((j) => j.id === activeJobId);
    if (job) Object.assign(job, updates);
  };

  (async () => {
    updateJob({ status: 'bundling', progress: 0 });

    try {
      const { bundle } = await import('@rendiv/bundler');
      const { selectComposition, renderMedia, closeBrowser } = await import('@rendiv/renderer');

      // Step 1: Bundle
      const bundlePath = await bundle({
        entryPoint,
        onProgress: (p: number) => {
          updateJob({ progress: p });
        },
      });

      if (abortController.signal.aborted) {
        updateJob({ status: 'cancelled' });
        return;
      }

      // Step 2: Get composition metadata
      const composition = await selectComposition(bundlePath, nextJob.compositionId, nextJob.inputProps);

      if (abortController.signal.aborted) {
        updateJob({ status: 'cancelled' });
        return;
      }

      // Step 3: Render
      updateJob({ status: 'rendering', renderedFrames: 0, totalFrames: composition.durationInFrames, progress: 0 });
      await renderMedia({
        composition,
        serveUrl: bundlePath,
        codec: nextJob.codec,
        outputLocation: nextJob.outputPath,
        inputProps: nextJob.inputProps,
        concurrency: nextJob.concurrency,
        imageFormat: nextJob.imageFormat,
        encodingPreset: nextJob.encodingPreset,
        crf: nextJob.crf,
        videoEncoder: nextJob.videoEncoder,
        gl: nextJob.gl,
        onProgress: ({ progress, renderedFrames, totalFrames }: { progress: number; renderedFrames: number; totalFrames: number }) => {
          if (progress < 0.9) {
            updateJob({ status: 'rendering', renderedFrames, totalFrames, progress });
          } else if (progress < 1) {
            updateJob({ status: 'encoding' });
          }
        },
        cancelSignal: abortController.signal,
      });

      if (abortController.signal.aborted) {
        updateJob({ status: 'cancelled' });
      } else {
        updateJob({ status: 'done', progress: 1 });
      }

      await closeBrowser();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      updateJob({ status: 'error', error: message });
      try {
        const { closeBrowser } = await import('@rendiv/renderer');
        await closeBrowser();
      } catch {
        // ignore cleanup errors
      }
    } finally {
      activeJobId = null;
      activeAbortController = null;
      processQueue(entryPoint);
    }
  })();
}

function jsonResponse(res: ServerResponse, data: unknown, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

export function rendivStudioPlugin(options: StudioPluginOptions): Plugin {
  const { studioHtmlFileName, entryPoint, workspaceDir, onSwitchProject } = options;

  // Timeline overrides persistence — stored at project root so they survive server restarts
  const overridesFile = join(process.cwd(), 'timeline-overrides.json');

  async function readOverrides(): Promise<Record<string, { from: number; durationInFrames: number }>> {
    try {
      const raw = await readFile(overridesFile, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  // Track when the server itself writes overrides so the file watcher can ignore self-writes
  let lastSelfWriteTime = 0;

  async function writeOverrides(data: Record<string, { from: number; durationInFrames: number }>): Promise<void> {
    lastSelfWriteTime = Date.now();
    await writeFile(overridesFile, JSON.stringify(data, null, 2));
  }

  return {
    name: 'rendiv-studio',
    configureServer(server) {
      // Timeline override API endpoints
      server.middlewares.use((req, res, next) => {
        // GET /timeline/overrides — read all overrides
        if (req.method === 'GET' && req.url === '/__rendiv_api__/timeline/overrides') {
          readOverrides().then((overrides) => {
            jsonResponse(res, { overrides });
          }).catch(() => {
            jsonResponse(res, { overrides: {} });
          });
          return;
        }

        // PUT /timeline/overrides — write all overrides
        if (req.method === 'PUT' && req.url === '/__rendiv_api__/timeline/overrides') {
          readBody(req).then(async (raw) => {
            const body = JSON.parse(raw);
            await writeOverrides(body.overrides ?? {});
            jsonResponse(res, { ok: true });
          }).catch((err) => {
            jsonResponse(res, { error: String(err) }, 500);
          });
          return;
        }

        // DELETE /timeline/overrides — clear all overrides
        if (req.method === 'DELETE' && req.url === '/__rendiv_api__/timeline/overrides') {
          unlink(overridesFile).catch(() => {}).then(() => {
            jsonResponse(res, { ok: true });
          });
          return;
        }

        next();
      });

      // Watch timeline-overrides.json for external edits and push updates to clients
      // Uses Vite's chokidar watcher which handles atomic saves (write-temp → rename) reliably
      let watchDebounce: ReturnType<typeof setTimeout> | undefined;

      server.watcher.add(overridesFile);
      server.watcher.on('change', (changedPath) => {
        if (changedPath !== overridesFile) return;
        // Ignore changes caused by our own writes (within 500ms)
        if (Date.now() - lastSelfWriteTime < 500) return;

        if (watchDebounce) clearTimeout(watchDebounce);
        watchDebounce = setTimeout(() => {
          readOverrides()
            .then((overrides) => {
              server.ws.send({
                type: 'custom',
                event: 'rendiv:overrides-update',
                data: { overrides },
              });
            })
            .catch(() => {});
        }, 100);
      });

      // Clean up terminal when server closes
      server.httpServer?.on('close', () => {
        if (terminalProcess) {
          terminalProcess.kill();
          terminalProcess = null;
        }
      });

      // --- Terminal PTY WebSocket handlers ---

      server.ws.on('rendiv:terminal-start', async (data: { cols?: number; rows?: number }) => {
        if (terminalProcess) {
          server.ws.send({ type: 'custom', event: 'rendiv:terminal-started', data: { pid: terminalProcess.pid } });
          return;
        }

        const pty = await tryImportNodePty();
        if (!pty) {
          server.ws.send({ type: 'custom', event: 'rendiv:terminal-error', data: { message: 'node-pty is not installed. Run: pnpm add node-pty' } });
          return;
        }

        terminalCols = data.cols ?? 80;
        terminalRows = data.rows ?? 24;
        const shell = process.env.SHELL || '/bin/bash';

        try {
          terminalProcess = pty.spawn(shell, ['-l'], {
            name: 'xterm-256color',
            cols: terminalCols,
            rows: terminalRows,
            cwd: process.cwd(),
            env: { ...process.env } as Record<string, string>,
          });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          server.ws.send({ type: 'custom', event: 'rendiv:terminal-error', data: { message: `Failed to spawn terminal: ${msg}` } });
          return;
        }

        terminalProcess.onData((output: string) => {
          server.ws.send({ type: 'custom', event: 'rendiv:terminal-output', data: { data: output } });
        });

        terminalProcess.onExit(({ exitCode, signal }) => {
          terminalProcess = null;
          server.ws.send({ type: 'custom', event: 'rendiv:terminal-exited', data: { exitCode, signal } });
        });

        server.ws.send({ type: 'custom', event: 'rendiv:terminal-started', data: { pid: terminalProcess.pid } });

        // Launch claude in the shell after a short delay to let the shell initialize
        setTimeout(() => {
          terminalProcess?.write('claude\n');
        }, 300);
      });

      server.ws.on('rendiv:terminal-input', (data: { data: string }) => {
        terminalProcess?.write(data.data);
      });

      server.ws.on('rendiv:terminal-resize', (data: { cols: number; rows: number }) => {
        if (terminalProcess && data.cols > 0 && data.rows > 0) {
          terminalCols = data.cols;
          terminalRows = data.rows;
          terminalProcess.resize(data.cols, data.rows);
        }
      });

      server.ws.on('rendiv:terminal-stop', () => {
        if (terminalProcess) {
          terminalProcess.kill();
          terminalProcess = null;
        }
      });

      server.ws.on('rendiv:terminal-status', () => {
        server.ws.send({
          type: 'custom',
          event: 'rendiv:terminal-status-response',
          data: { running: terminalProcess !== null, pid: terminalProcess?.pid ?? null },
        });
      });

      // Render queue API endpoints
      server.middlewares.use((req, res, next) => {
        // GET /queue — return all jobs
        if (req.method === 'GET' && req.url === '/__rendiv_api__/render/queue') {
          jsonResponse(res, { jobs: renderJobs });
          return;
        }

        // POST /queue/clear — clear finished jobs (must be before :id/cancel match)
        if (req.method === 'POST' && req.url === '/__rendiv_api__/render/queue/clear') {
          renderJobs = renderJobs.filter((j) =>
            j.status !== 'done' && j.status !== 'error' && j.status !== 'cancelled'
          );
          jsonResponse(res, { ok: true });
          return;
        }

        // POST /queue — add a new job
        if (req.method === 'POST' && req.url === '/__rendiv_api__/render/queue') {
          readBody(req).then((raw) => {
            const body = JSON.parse(raw);
            const job: ServerRenderJob = {
              id: String(nextJobId++),
              compositionId: body.compositionId,
              compositionName: body.compositionName ?? body.compositionId,
              codec: body.codec ?? 'mp4',
              outputPath: body.outputPath,
              inputProps: body.inputProps ?? {},
              status: 'queued',
              progress: 0,
              renderedFrames: 0,
              totalFrames: body.totalFrames ?? 0,
              imageFormat: body.imageFormat,
              encodingPreset: body.encodingPreset,
              crf: body.crf != null ? Number(body.crf) : undefined,
              videoEncoder: body.videoEncoder,
              gl: body.gl,
              concurrency: body.concurrency != null ? Number(body.concurrency) : undefined,
            };
            renderJobs.push(job);
            processQueue(entryPoint);
            jsonResponse(res, { job });
          });
          return;
        }

        // POST /queue/:id/cancel — cancel a specific job
        const cancelMatch = req.url?.match(/^\/__rendiv_api__\/render\/queue\/([^/]+)\/cancel$/);
        if (req.method === 'POST' && cancelMatch) {
          const jobId = cancelMatch[1];
          const job = renderJobs.find((j) => j.id === jobId);
          if (job) {
            if (job.status === 'queued') {
              job.status = 'cancelled';
            } else if (activeJobId === jobId && activeAbortController) {
              activeAbortController.abort();
            }
          }
          jsonResponse(res, { ok: true });
          return;
        }

        // GET /queue/:id/download — download the rendered file
        const downloadMatch = req.url?.match(/^\/__rendiv_api__\/render\/queue\/([^/]+)\/download$/);
        if (req.method === 'GET' && downloadMatch) {
          const jobId = downloadMatch[1];
          const job = renderJobs.find((j) => j.id === jobId);
          if (!job || job.status !== 'done') {
            jsonResponse(res, { error: 'Job not found or not finished' }, 404);
            return;
          }
          const absolutePath = resolve(process.cwd(), job.outputPath);
          fsStat(absolutePath).then((fileStat) => {
            const contentType = job.codec === 'webm' ? 'video/webm' : 'video/mp4';
            res.writeHead(200, {
              'Content-Type': contentType,
              'Content-Disposition': `attachment; filename="${basename(absolutePath)}"`,
              'Content-Length': fileStat.size,
            });
            createReadStream(absolutePath).pipe(res);
          }).catch(() => {
            jsonResponse(res, { error: 'Rendered file not found on disk' }, 404);
          });
          return;
        }

        // DELETE /queue/:id — remove a finished job
        const deleteMatch = req.url?.match(/^\/__rendiv_api__\/render\/queue\/([^/]+)$/);
        if (req.method === 'DELETE' && deleteMatch) {
          const jobId = deleteMatch[1];
          renderJobs = renderJobs.filter((j) => j.id !== jobId);
          jsonResponse(res, { ok: true });
          return;
        }

        next();
      });

      // --- Assets API endpoints ---
      const publicDir = resolve(process.cwd(), 'public');

      interface AssetEntry {
        name: string;
        path: string;
        type: 'file' | 'directory';
        size: number;
        children?: AssetEntry[];
      }

      async function listAssets(dir: string): Promise<AssetEntry[]> {
        try {
          const entries = await readdir(dir, { withFileTypes: true });
          const sorted = entries.sort((a, b) => {
            // Directories first, then alphabetical
            if (a.isDirectory() && !b.isDirectory()) return -1;
            if (!a.isDirectory() && b.isDirectory()) return 1;
            return a.name.localeCompare(b.name);
          });
          const result: AssetEntry[] = [];
          for (const entry of sorted) {
            if (entry.name.startsWith('.')) continue; // skip dotfiles
            const fullPath = join(dir, entry.name);
            // Path traversal protection
            if (!fullPath.startsWith(publicDir)) continue;
            const relativePath = relative(publicDir, fullPath);
            if (entry.isDirectory()) {
              const children = await listAssets(fullPath);
              result.push({ name: entry.name, path: relativePath, type: 'directory', size: 0, children });
            } else {
              const st = await fsStat(fullPath);
              result.push({ name: entry.name, path: relativePath, type: 'file', size: st.size });
            }
          }
          return result;
        } catch {
          return [];
        }
      }

      server.middlewares.use((req, res, next) => {
        if (req.method === 'GET' && req.url === '/__rendiv_api__/assets/list') {
          listAssets(publicDir).then((entries) => {
            jsonResponse(res, { entries });
          }).catch(() => {
            jsonResponse(res, { entries: [] });
          });
          return;
        }

        // POST /assets/upload — upload a file to the public directory
        if (req.method === 'POST' && req.url?.startsWith('/__rendiv_api__/assets/upload')) {
          const url = new URL(req.url, 'http://localhost');
          const rawFilename = url.searchParams.get('filename');
          const rawDir = url.searchParams.get('dir') ?? '';

          if (!rawFilename) {
            jsonResponse(res, { error: 'Missing filename parameter' }, 400);
            return;
          }

          const filename = sanitizeFilename(rawFilename);
          const normalizedDir = normalize(rawDir).replace(/\.\./g, '');
          const targetDir = resolve(publicDir, normalizedDir);

          if (!targetDir.startsWith(publicDir)) {
            jsonResponse(res, { error: 'Invalid target directory' }, 400);
            return;
          }

          const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

          readRawBody(req, MAX_FILE_SIZE)
            .then(async (buffer) => {
              await mkdir(targetDir, { recursive: true });
              const filePath = join(targetDir, filename);

              if (!filePath.startsWith(publicDir)) {
                jsonResponse(res, { error: 'Invalid file path' }, 400);
                return;
              }

              await writeFile(filePath, buffer);
              const relativePath = relative(publicDir, filePath);
              jsonResponse(res, { ok: true, path: relativePath, size: buffer.length });
            })
            .catch((err) => {
              const message = err instanceof Error ? err.message : String(err);
              jsonResponse(res, { error: message }, 500);
            });
          return;
        }

        // POST /assets/mkdir — create a new directory
        if (req.method === 'POST' && req.url?.startsWith('/__rendiv_api__/assets/mkdir')) {
          const url = new URL(req.url, 'http://localhost');
          const rawPath = url.searchParams.get('path');

          if (!rawPath) {
            jsonResponse(res, { error: 'Missing path parameter' }, 400);
            return;
          }

          const sanitizedPath = rawPath.split('/').map(sanitizeFilename).join('/');
          const targetDir = resolve(publicDir, sanitizedPath);

          if (!targetDir.startsWith(publicDir)) {
            jsonResponse(res, { error: 'Invalid directory path' }, 400);
            return;
          }

          mkdir(targetDir, { recursive: true })
            .then(() => {
              const relativePath = relative(publicDir, targetDir);
              jsonResponse(res, { ok: true, path: relativePath });
            })
            .catch((err) => {
              jsonResponse(res, { error: err instanceof Error ? err.message : String(err) }, 500);
            });
          return;
        }

        // POST /assets/move — move a file or directory
        if (req.method === 'POST' && req.url?.startsWith('/__rendiv_api__/assets/move')) {
          const url = new URL(req.url, 'http://localhost');
          const fromPath = url.searchParams.get('from');
          const toPath = url.searchParams.get('to');

          if (!fromPath || !toPath) {
            jsonResponse(res, { error: 'Missing from or to parameter' }, 400);
            return;
          }

          const fromAbs = resolve(publicDir, fromPath);
          let toAbs = resolve(publicDir, toPath);

          if (!fromAbs.startsWith(publicDir) || !toAbs.startsWith(publicDir)) {
            jsonResponse(res, { error: 'Invalid path' }, 400);
            return;
          }

          (async () => {
            try {
              // If target is an existing directory, move the item into it
              try {
                const st = await fsStat(toAbs);
                if (st.isDirectory()) {
                  toAbs = join(toAbs, basename(fromAbs));
                }
              } catch {
                // Target doesn't exist yet — that's fine, it's the new name/location
              }

              if (!toAbs.startsWith(publicDir)) {
                jsonResponse(res, { error: 'Invalid target path' }, 400);
                return;
              }

              // Ensure parent directory exists
              const parentDir = join(toAbs, '..');
              await mkdir(parentDir, { recursive: true });

              await rename(fromAbs, toAbs);
              const newRelativePath = relative(publicDir, toAbs);
              jsonResponse(res, { ok: true, from: fromPath, to: newRelativePath });
            } catch (err) {
              jsonResponse(res, { error: err instanceof Error ? err.message : String(err) }, 500);
            }
          })();
          return;
        }

        // DELETE /assets/delete — delete a file or empty directory
        if (req.method === 'DELETE' && req.url?.startsWith('/__rendiv_api__/assets/delete')) {
          const url = new URL(req.url, 'http://localhost');
          const rawPath = url.searchParams.get('path');

          if (!rawPath) {
            jsonResponse(res, { error: 'Missing path parameter' }, 400);
            return;
          }

          const targetPath = resolve(publicDir, rawPath);

          if (!targetPath.startsWith(publicDir) || targetPath === publicDir) {
            jsonResponse(res, { error: 'Invalid path' }, 400);
            return;
          }

          (async () => {
            try {
              const st = await fsStat(targetPath);
              if (st.isDirectory()) {
                await rmdir(targetPath);
              } else {
                await unlink(targetPath);
              }
              jsonResponse(res, { ok: true });
            } catch (err) {
              jsonResponse(res, { error: err instanceof Error ? err.message : String(err) }, 500);
            }
          })();
          return;
        }

        next();
      });

      // --- Workspace API endpoints (only available when launched from workspace) ---
      if (workspaceDir && onSwitchProject) {
        server.middlewares.use((req, res, next) => {
          // POST /workspace/back — return to workspace picker
          if (req.method === 'POST' && req.url === '/__rendiv_api__/workspace/back') {
            jsonResponse(res, { status: 'switching' });
            // Delay to ensure HTTP response is flushed before server restart
            setTimeout(() => onSwitchProject(null), 100);
            return;
          }

          next();
        });
      }

      // Rewrite root requests to serve the studio HTML instead of the user's index.html
      server.middlewares.use((req, _res, next) => {
        if (req.url === '/' || req.url === '/index.html') {
          req.url = `/${studioHtmlFileName}`;
        }
        next();
      });
    },
  };
}
