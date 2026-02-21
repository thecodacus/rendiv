import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { readFile, writeFile, unlink } from 'node:fs/promises';
import { watch, type FSWatcher } from 'node:fs';
import { join } from 'node:path';

export interface StudioPluginOptions {
  studioHtmlFileName: string;
  entryPoint: string;
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
}

let renderJobs: ServerRenderJob[] = [];
let nextJobId = 1;
let activeJobId: string | null = null;
let activeAbortController: AbortController | null = null;

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', reject);
  });
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
  const { studioHtmlFileName, entryPoint } = options;

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
      let overridesWatcher: FSWatcher | undefined;
      let watchDebounce: ReturnType<typeof setTimeout> | undefined;

      try {
        overridesWatcher = watch(overridesFile, () => {
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
      } catch {
        // File doesn't exist yet — that's fine, watch will be set up when it's first created
      }

      // Clean up watcher when server closes
      server.httpServer?.on('close', () => {
        overridesWatcher?.close();
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
