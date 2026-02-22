import { FAVICON_SVG } from './studio-entry-code.js';

export { FAVICON_SVG };

/**
 * Generates the JSX entry code for the Workspace Picker.
 * This imports the WorkspacePicker UI and mounts it.
 */
export function generateWorkspaceEntryCode(studioUiDir: string): string {
  const normalizedUiDir = studioUiDir.replace(/\\/g, '/');

  return `
import { createWorkspaceApp } from '${normalizedUiDir}/WorkspacePicker.tsx';

createWorkspaceApp(document.getElementById('root'));
`;
}

/**
 * Generates the HTML template for the Workspace Picker.
 */
export function generateWorkspaceHtml(entryFileName: string, faviconPath: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="icon" type="image/svg+xml" href="/${faviconPath}" />
  <title>Rendiv Studio — Projects</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #root { width: 100%; height: 100vh; overflow: hidden; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>window.__RENDIV_WORKSPACE_MODE__ = true;</script>
  <script type="module" src="/${entryFileName}"></script>
</body>
</html>`;
}
