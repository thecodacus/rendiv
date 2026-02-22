import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

// --- Inline project template (same as create-rendiv) ---

const PACKAGE_JSON_TEMPLATE = `{
  "name": "{{PROJECT_NAME}}",
  "private": true,
  "type": "module",
  "scripts": {
    "preview": "vite dev",
    "studio": "rendiv studio src/index.tsx",
    "render": "rendiv render src/index.tsx MyVideo out/my-video.mp4",
    "still": "rendiv still src/index.tsx MyVideo out/still.png",
    "compositions": "rendiv compositions src/index.tsx"
  },
  "dependencies": {
    "@rendiv/core": "^0.1.0",
    "@rendiv/player": "^0.1.0",
    "@rendiv/cli": "^0.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^6.0.0",
    "typescript": "^5.7.0"
  }
}
`;

const TSCONFIG_JSON = `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
`;

const VITE_CONFIG = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`;

const GITIGNORE = `node_modules
dist
out
.studio
`;

const INDEX_TSX = `import React from 'react';
import { setRootComponent, Composition } from '@rendiv/core';
import { MyVideo } from './MyVideo';

const Root: React.FC = () => (
  <Composition
    id="MyVideo"
    component={MyVideo}
    durationInFrames={150}
    fps={30}
    width={1920}
    height={1080}
  />
);

setRootComponent(Root);
`;

const MY_VIDEO_TSX = `import React from 'react';
import { useFrame, useCompositionConfig, Fill, interpolate, spring } from '@rendiv/core';

export const MyVideo: React.FC = () => {
  const frame = useFrame();
  const { fps, durationInFrames } = useCompositionConfig();

  const opacity = interpolate(frame, [0, 30], [0, 1]);
  const scale = spring({ frame, fps, config: { damping: 12 } });
  const progress = frame / durationInFrames;

  return (
    <Fill
      style={{
        background: \`linear-gradient(135deg, #0f0f0f \${(1 - progress) * 100}%, #1a1a2e 100%)\`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <h1
        style={{
          color: 'white',
          fontSize: 80,
          fontFamily: 'system-ui, sans-serif',
          opacity,
          transform: \`scale(\${scale})\`,
        }}
      >
        Hello, Rendiv!
      </h1>
    </Fill>
  );
};
`;

function detectPackageManager(): string {
  const agent = process.env.npm_config_user_agent ?? '';
  if (agent.startsWith('pnpm')) return 'pnpm';
  if (agent.startsWith('yarn')) return 'yarn';
  if (agent.startsWith('bun')) return 'bun';
  return 'npm';
}

/**
 * Scaffold a new Rendiv project in the given workspace directory.
 * Returns a promise that resolves when the project is fully created and deps installed.
 * Calls `onProgress` with status messages for the UI.
 */
export async function scaffoldProject(
  workspaceDir: string,
  name: string,
  onProgress?: (message: string) => void,
): Promise<{ success: boolean; error?: string }> {
  const projectDir = path.join(workspaceDir, name);

  // Validate name
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    return { success: false, error: 'Project name must only contain letters, numbers, hyphens, and underscores.' };
  }

  if (fs.existsSync(projectDir)) {
    return { success: false, error: `Directory "${name}" already exists.` };
  }

  try {
    onProgress?.('Creating project files...');

    // Create directories
    fs.mkdirSync(path.join(projectDir, 'src'), { recursive: true });

    // Write template files
    const pkgJson = PACKAGE_JSON_TEMPLATE.replace(/\{\{PROJECT_NAME\}\}/g, name);
    fs.writeFileSync(path.join(projectDir, 'package.json'), pkgJson);
    fs.writeFileSync(path.join(projectDir, 'tsconfig.json'), TSCONFIG_JSON);
    fs.writeFileSync(path.join(projectDir, 'vite.config.ts'), VITE_CONFIG);
    fs.writeFileSync(path.join(projectDir, '.gitignore'), GITIGNORE);
    fs.writeFileSync(path.join(projectDir, 'src', 'index.tsx'), INDEX_TSX);
    fs.writeFileSync(path.join(projectDir, 'src', 'MyVideo.tsx'), MY_VIDEO_TSX);

    onProgress?.('Installing dependencies...');

    // Install dependencies
    const pm = detectPackageManager();
    await new Promise<void>((resolve, reject) => {
      const child = spawn(pm, ['install'], {
        cwd: projectDir,
        stdio: 'pipe',
        shell: true,
      });

      child.stdout?.on('data', (data: Buffer) => {
        const line = data.toString().trim();
        if (line) onProgress?.(line);
      });

      child.stderr?.on('data', (data: Buffer) => {
        const line = data.toString().trim();
        if (line) onProgress?.(line);
      });

      child.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`${pm} install exited with code ${code}`));
      });

      child.on('error', reject);
    });

    onProgress?.('Project created successfully!');
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}
