/**
 * Generates the JSX entry code for the Studio.
 * This code imports the user's entry (which calls setRootComponent),
 * then mounts the Studio React UI shell.
 */
export function generateStudioEntryCode(
  userEntryPoint: string,
  studioUiDir: string,
  relativeEntryPoint: string,
  workspaceDir?: string,
): string {
  // Normalize backslashes to forward slashes for import paths
  const normalizedEntry = userEntryPoint.replace(/\\/g, '/');
  const normalizedUiDir = studioUiDir.replace(/\\/g, '/');

  return `
import '${normalizedEntry}';
import { createStudioApp } from '${normalizedUiDir}/StudioApp.tsx';

createStudioApp(document.getElementById('root'));
`;
}

/**
 * Generates a small inline script that sets global config before module scripts load.
 * This runs synchronously before ES module imports, ensuring globals are available.
 */
export function generateStudioGlobals(
  relativeEntryPoint: string,
  workspaceDir?: string,
): string {
  const lines = [
    `window.__RENDIV_STUDIO_ENTRY__ = ${JSON.stringify(relativeEntryPoint)};`,
  ];
  if (workspaceDir) {
    lines.push(`window.__RENDIV_WORKSPACE_DIR__ = ${JSON.stringify(workspaceDir)};`);
  }
  return lines.join('\n');
}

/** Favicon SVG content (icon-only version of the Rendiv logo). */
export const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
  <rect x="6" y="8" width="26" height="20" rx="3" stroke="#58a6ff" stroke-width="2" opacity="0.35"/>
  <rect x="12" y="14" width="26" height="20" rx="3" stroke="#58a6ff" stroke-width="2"/>
  <clipPath id="ic"><rect x="12" y="14" width="26" height="20" rx="3"/></clipPath>
  <g clip-path="url(#ic)"><polygon points="12,34 30,14 38,14 38,34" fill="#58a6ff" opacity="0.25"/></g>
  <path d="M22 20L30 24L22 28Z" fill="#58a6ff"/>
</svg>`;

/**
 * Generates the HTML template for the Studio shell.
 */
export function generateStudioHtml(entryFileName: string, faviconPath: string, globalsScript?: string): string {
  const globalsTag = globalsScript
    ? `\n  <script>${globalsScript}</script>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="icon" type="image/svg+xml" href="/${faviconPath}" />
  <title>Rendiv Studio</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #root { width: 100%; height: 100vh; overflow: hidden; }
  </style>
</head>
<body>
  <div id="root"></div>${globalsTag}
  <script type="module" src="/${entryFileName}"></script>
</body>
</html>`;
}
