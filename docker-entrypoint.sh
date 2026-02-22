#!/bin/sh
set -e

# Install Claude Code on first run if not already present.
# Claude Code is proprietary (Anthropic Commercial ToS), so it cannot be
# baked into the image. Instead we install it at runtime — the user pulling
# and running this container is accepting Anthropic's terms themselves.
if ! command -v claude >/dev/null 2>&1; then
  echo "Installing Claude Code (first run only)..."
  npm install -g @anthropic-ai/claude-code --quiet 2>/dev/null || \
    echo "Warning: Claude Code installation failed. You can install it manually with: npm install -g @anthropic-ai/claude-code"
fi

exec "$@"
