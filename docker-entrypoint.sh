#!/bin/sh
set -e

# Install/update Claude Code and Codex CLI on every container start.
# This ensures you always get the latest versions.
# Claude Code is proprietary (Anthropic Commercial ToS) — by running this
# container the user is accepting those terms themselves.
echo "Checking AI agent CLIs..."

if ! command -v claude >/dev/null 2>&1; then
  echo "  Installing Claude Code..."
  npm install -g @anthropic-ai/claude-code --quiet 2>/dev/null || \
    echo "  Warning: Claude Code installation failed. Install manually: npm install -g @anthropic-ai/claude-code"
else
  echo "  Claude Code: $(claude --version 2>/dev/null || echo 'installed')"
fi

if ! command -v codex >/dev/null 2>&1; then
  echo "  Installing Codex CLI..."
  npm install -g @openai/codex --quiet 2>/dev/null || \
    echo "  Warning: Codex CLI installation failed. Install manually: npm install -g @openai/codex"
else
  echo "  Codex CLI: $(codex --version 2>/dev/null || echo 'installed')"
fi

exec "$@"
