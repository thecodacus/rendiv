# Docker

Run Rendiv Studio in a container for cloud-hosted, remote, or reproducible setups. The official Docker image ships with everything needed to preview, edit, and render videos — plus AI agent tooling out of the box.

## Quick Start

```bash
docker run -v /path/to/projects:/workspace -p 3000:3000 ghcr.io/thecodacus/rendiv-studio
```

Open `http://localhost:3000` — you'll see the workspace picker with your projects.

## What's Included

| Component | Details |
|-----------|---------|
| Node.js 20 | Runtime for Studio and rendering |
| Playwright Chromium | Headless browser for server-side frame capture |
| FFmpeg | Video stitching (MP4, WebM, GIF) |
| node-pty | Powers the integrated agent terminal |
| Claude Code | Installed on first container start |
| Codex CLI | Installed on first container start |
| rendiv-video skill | Preloaded globally for Claude Code and Codex |
| git, curl | General utilities |

## Configuration

### Custom Port

```bash
docker run -v ./projects:/workspace -p 4000:4000 \
  ghcr.io/thecodacus/rendiv-studio \
  rendiv studio --workspace /workspace --port 4000 --host 0.0.0.0
```

### API Keys

Pass your API keys as environment variables so the integrated agents can authenticate:

```bash
docker run -v ./projects:/workspace -p 3000:3000 \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  -e OPENAI_API_KEY=sk-... \
  ghcr.io/thecodacus/rendiv-studio
```

### Interactive Shell

Drop into the container to use Claude Code, Codex, or the rendiv CLI directly:

```bash
docker run -it -v ./projects:/workspace -p 3000:3000 \
  ghcr.io/thecodacus/rendiv-studio bash
```

## Docker Compose

```yaml
services:
  studio:
    image: ghcr.io/thecodacus/rendiv-studio
    ports:
      - "3000:3000"
    volumes:
      - ./projects:/workspace
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
```

Start with:

```bash
docker compose up
```

## AI Agent Skills

The `rendiv-video` [agent skill](/guide/ai-skills) is preloaded globally on container startup. Both Claude Code and Codex discover it automatically — no manual `npx skills add` needed.

On first start, the entrypoint:

1. Installs Claude Code and Codex CLI (if not already present)
2. Symlinks the bundled skill into `~/.claude/skills/` and `~/.codex/skills/`

This means any project you open in the container gets full rendiv guidance from the agent immediately.

## Cloud Hosting

The image is designed for remote access:

- The server binds to `0.0.0.0` by default (accessible from outside the container)
- Single port for everything — workspace picker, project Studio, and rendering
- The workspace picker survives page refreshes and reconnects automatically
- Render jobs run server-side and persist across browser reconnections

### Typical Cloud Setup

1. Deploy the container on a cloud VM or container service (e.g., Railway, Fly.io, Google Cloud Run, AWS ECS)
2. Mount a persistent volume at `/workspace` for your project files
3. Expose port 3000 (or your chosen port)
4. Set `ANTHROPIC_API_KEY` and/or `OPENAI_API_KEY` as environment secrets
5. Access Studio from any browser via the public URL

## Workspace Mode

The Docker image runs Studio in **workspace mode** by default. This means:

- `/workspace` is scanned for subdirectories containing Rendiv projects
- A project picker UI lists all detected projects
- Click a project to launch its full Studio environment
- Click "Projects" in the top bar to return to the picker

A subdirectory is detected as a Rendiv project if it has a `package.json` with `@rendiv/core` in `dependencies` or `devDependencies`.

See [Studio — Multi-Project Workspace Mode](/guide/studio#multi-project-workspace-mode) for more details.

## Building the Image Locally

```bash
git clone https://github.com/thecodacus/rendiv.git
cd rendiv
docker build -t rendiv-studio .
docker run -v ./projects:/workspace -p 3000:3000 rendiv-studio
```
