import type { Plugin } from 'vite';

export interface StudioPluginOptions {
  studioHtmlFileName: string;
}

export function rendivStudioPlugin(options: StudioPluginOptions): Plugin {
  const { studioHtmlFileName } = options;

  return {
    name: 'rendiv-studio',
    configureServer(server) {
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
