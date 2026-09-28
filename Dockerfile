# =============================================================================
# Rendiv Studio Docker Image
#
# Provides a ready-to-run Rendiv Studio in workspace mode with:
#   - Playwright Chromium + FFmpeg for server-side rendering
#   - node-pty for the integrated agent terminal
#   - Startup script that auto-installs Claude Code + Codex CLI on first run
#
# Usage:
#   docker run -v /path/to/projects:/workspace -v agent-persist:/persist -p 3000:3000 ghcr.io/thecodacus/rendiv-studio
#
# GPU rendering (NVIDIA, needs the NVIDIA Container Toolkit on the host): add `--gpus all` (compose:
# deploy.resources.reservations.devices: [{driver: nvidia, count: all, capabilities: [gpu]}]) and render with
# `--gl angle` (Vulkan) or `--gl egl`. Without a GPU the image still renders on the CPU (SwiftShader).
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
COPY packages/gif/package.json packages/gif/
COPY packages/captions/package.json packages/captions/
COPY packages/text/package.json packages/text/
COPY packages/effects/package.json packages/effects/
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
    libxfixes3 \
    # node-pty build dependencies
    make g++ python3 \
    # General utilities
    git curl \
    # GPU rendering: Vulkan loader + GLVND EGL/GL so headless Chromium can reach the host GPU driver that
    # --gpus injects. Without these it silently falls back to SwiftShader (CPU) even with a GPU passed in.
    libvulkan1 libegl1 libgl1 libglvnd0 \
    && rm -rf /var/lib/apt/lists/*

# NVIDIA vendor files for the Vulkan loader and GLVND EGL. The NVIDIA Container Toolkit injects the driver libraries
# (libGLX_nvidia / libEGL_nvidia) but not always these JSONs; harmless on machines without an NVIDIA GPU.
RUN mkdir -p /usr/share/vulkan/icd.d /usr/share/glvnd/egl_vendor.d \
    && printf '%s' '{"file_format_version":"1.0.0","ICD":{"library_path":"libGLX_nvidia.so.0","api_version":"1.3.0"}}' \
       > /usr/share/vulkan/icd.d/nvidia_icd.json \
    && printf '%s' '{"file_format_version":"1.0.0","ICD":{"library_path":"libEGL_nvidia.so.0"}}' \
       > /usr/share/glvnd/egl_vendor.d/10_nvidia.json
# Ask the NVIDIA runtime for the graphics libraries too (compute-only is the default and has no Vulkan/EGL)
ENV NVIDIA_DRIVER_CAPABILITIES=all

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Copy built monorepo from builder
WORKDIR /app
COPY --from=builder /build/ ./

# Install Playwright browsers + system dependencies (Chromium only, for rendering)
RUN cd /app/packages/renderer && npx playwright install --with-deps chromium

# Create the workspace mount point and persist directory for agent configs
RUN mkdir -p /workspace /persist

# Make the CLI available globally via symlink
RUN ln -s /app/packages/cli/dist/cli.js /usr/local/bin/rendiv && \
    chmod +x /app/packages/cli/dist/cli.js

# Copy startup script that installs Claude Code on first run
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose the default Studio port
EXPOSE 3000

# Default: start Studio in workspace mode on the mounted /workspace directory
WORKDIR /workspace
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["rendiv", "studio", "--workspace", "/workspace", "--port", "3000", "--host", "0.0.0.0"]
