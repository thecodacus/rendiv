import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';

export interface StudioPluginOptions {
  studioHtmlFileName: string;
  entryPoint: string;
}

/** Active render state — only one render at a time. */
let activeAbortController: AbortController | null = null;

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', reject);
  });
}

function writeLine(res: ServerResponse, data: Record<string, unknown>) {
  res.write(JSON.stringify(data) + '\n');
}

async function handleRender(
  req: IncomingMessage,
  res: ServerResponse,
  entryPoint: string,
) {
  if (activeAbortController) {
    res.writeHead(409, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'A render is already in progress' }));
    return;
  }

  const body = JSON.parse(await readBody(req));
  const { compositionId, codec = 'mp4', outputPath, inputProps = {} } = body as {
    compositionId: string;
    codec?: 'mp4' | 'webm';
    outputPath: string;
    inputProps?: Record<string, unknown>;
  };

  const abortController = new AbortController();
  activeAbortController = abortController;

  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Transfer-Encoding': 'chunked',
    'Cache-Control': 'no-cache',
    'X-Content-Type-Options': 'nosniff',
  });

  try {
    // Dynamic imports so these are only loaded when rendering
    const { bundle } = await import('@rendiv/bundler');
    const { selectComposition, renderMedia, closeBrowser } = await import('@rendiv/renderer');

    // Step 1: Bundle
    writeLine(res, { type: 'bundling', progress: 0 });
    const bundlePath = await bundle({
      entryPoint,
      onProgress: (p: number) => {
        writeLine(res, { type: 'bundling', progress: p });
      },
    });

    if (abortController.signal.aborted) {
      writeLine(res, { type: 'cancelled' });
      res.end();
      return;
    }

    // Step 2: Get composition metadata
    writeLine(res, { type: 'metadata' });
    const composition = await selectComposition(bundlePath, compositionId, inputProps);

    if (abortController.signal.aborted) {
      writeLine(res, { type: 'cancelled' });
      res.end();
      return;
    }

    // Step 3: Render
    writeLine(res, { type: 'rendering', renderedFrames: 0, totalFrames: composition.durationInFrames, progress: 0 });
    await renderMedia({
      composition,
      serveUrl: bundlePath,
      codec,
      outputLocation: outputPath,
      inputProps,
      onProgress: ({ progress, renderedFrames, totalFrames }) => {
        if (progress < 0.9) {
          writeLine(res, { type: 'rendering', renderedFrames, totalFrames, progress });
        } else if (progress < 1) {
          writeLine(res, { type: 'encoding' });
        }
      },
      cancelSignal: abortController.signal,
    });

    if (abortController.signal.aborted) {
      writeLine(res, { type: 'cancelled' });
    } else {
      writeLine(res, { type: 'done', outputPath });
    }

    await closeBrowser();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    writeLine(res, { type: 'error', message });
    try {
      const { closeBrowser } = await import('@rendiv/renderer');
      await closeBrowser();
    } catch {
      // ignore cleanup errors
    }
  } finally {
    activeAbortController = null;
    res.end();
  }
}

function handleCancel(_req: IncomingMessage, res: ServerResponse) {
  if (activeAbortController) {
    activeAbortController.abort();
    activeAbortController = null;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, message: 'No render in progress' }));
  }
}

export function rendivStudioPlugin(options: StudioPluginOptions): Plugin {
  const { studioHtmlFileName, entryPoint } = options;

  return {
    name: 'rendiv-studio',
    configureServer(server) {
      // Render API endpoints
      server.middlewares.use((req, res, next) => {
        if (req.method === 'POST' && req.url === '/__rendiv_api__/render') {
          handleRender(req, res, entryPoint);
          return;
        }
        if (req.method === 'POST' && req.url === '/__rendiv_api__/render/cancel') {
          handleCancel(req, res);
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
