/**
 * Generates the JSX entry code for the Studio.
 * This code imports the user's entry (which calls setRootComponent),
 * then mounts the Studio React UI shell.
 */
export function generateStudioEntryCode(
  userEntryPoint: string,
  studioUiDir: string,
  relativeEntryPoint: string,
): string {
  // Normalize backslashes to forward slashes for import paths
  const normalizedEntry = userEntryPoint.replace(/\\/g, '/');
  const normalizedUiDir = studioUiDir.replace(/\\/g, '/');

  return `
window.__RENDIV_STUDIO_ENTRY__ = ${JSON.stringify(relativeEntryPoint)};
import '${normalizedEntry}';
import { createStudioApp } from '${normalizedUiDir}/StudioApp.tsx';

createStudioApp(document.getElementById('root'));
`;
}

/**
 * Generates the HTML template for the Studio shell.
 */
export function generateStudioHtml(entryFileName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Rendiv Studio</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #root { width: 100%; height: 100vh; overflow: hidden; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/${entryFileName}"></script>
</body>
</html>`;
}
