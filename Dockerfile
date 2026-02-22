# =============================================================================
# Rendiv Studio Docker Image
#
# Provides a ready-to-run Rendiv Studio in workspace mode with:
#   - Claude Code and OpenAI Codex CLI pre-installed
#   - Playwright Chromium + FFmpeg for server-side rendering
#   - node-pty for the integrated agent terminal
#
# Usage:
#   docker run -v /path/to/projects:/workspace -p 3000:3000 ghcr.io/thecodacus/rendiv-studio
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Build the monorepo
# ---------------------------------------------------------------------------
FROM node:20-bookworm AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /build

# Copy lockfile + workspace config first for better layer caching
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY packages/tsconfig/ packages/tsconfig/
COPY packages/rendiv/package.json packages/rendiv/
COPY packages/player/package.json packages/player/
COPY packages/bundler/package.json packages/bundler/
COPY packages/renderer/package.json packages/renderer/
COPY packages/cli/package.json packages/cli/
COPY packages/studio/package.json packages/studio/
COPY packages/transitions/package.json packages/transitions/
COPY packages/shapes/package.json packages/shapes/
COPY packages/paths/package.json packages/paths/
COPY packages/noise/package.json packages/noise/
COPY packages/motion-blur/package.json packages/motion-blur/
COPY packages/lottie/package.json packages/lottie/
COPY packages/three/package.json packages/three/
COPY packages/fonts/package.json packages/fonts/
COPY packages/google-fonts/package.json packages/google-fonts/
COPY packages/create-rendiv/package.json packages/create-rendiv/
COPY packages/skills/package.json packages/skills/
COPY examples/hello-world/package.json examples/hello-world/

# Install dependencies (includes native builds like node-pty)
RUN pnpm install --frozen-lockfile

# Copy source code and build
COPY packages/ packages/
COPY examples/ examples/
RUN pnpm build

# ---------------------------------------------------------------------------
# Stage 2: Runtime image
# ---------------------------------------------------------------------------
FROM node:20-bookworm-slim

# System dependencies for Playwright Chromium, node-pty, and general tooling
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Playwright Chromium dependencies
    libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 libgbm1 \
    libpango-1.0-0 libcairo2 libasound2 libxshmfence1 libx11-xcb1 \
    # node-pty build dependencies
    make g++ python3 \
    # General utilities
    git curl \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Install Claude Code and OpenAI Codex CLI globally
RUN npm install -g @anthropic-ai/claude-code @openai/codex

# Copy built monorepo from builder
WORKDIR /app
COPY --from=builder /build/ ./

# Install Playwright browsers (Chromium only, for rendering)
RUN cd /app/packages/renderer && npx playwright install chromium

# Create the workspace mount point
RUN mkdir -p /workspace

# Make the CLI available globally via symlink
RUN ln -s /app/packages/cli/dist/cli.js /usr/local/bin/rendiv && \
    chmod +x /app/packages/cli/dist/cli.js

# Expose the default Studio port
EXPOSE 3000

# Default: start Studio in workspace mode on the mounted /workspace directory
WORKDIR /workspace
ENTRYPOINT ["rendiv"]
CMD ["studio", "--workspace", "/workspace", "--port", "3000", "--host", "0.0.0.0"]
