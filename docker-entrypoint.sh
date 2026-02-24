#!/bin/sh
set -e

# ── Persist agent configs across container upgrades ──
# /persist/ is intended to be mounted as a Docker volume. Agent tools
# expect their config in /root/ — we keep the real files in /persist/
# and symlink from /root/ so they survive container rebuilds.

PERSIST_DIR="/persist"
PERSIST_ITEMS=".claude .claude.json .codex"

for item in $PERSIST_ITEMS; do
    persist_path="$PERSIST_DIR/$item"
    root_path="/root/$item"

    if [ -e "$root_path" ] && [ ! -L "$root_path" ]; then
        # Real file/dir exists in container but not symlinked — migrate to volume
        if [ -e "$persist_path" ]; then
            # Volume already has it — merge dirs (no-clobber), skip files
            if [ -d "$root_path" ]; then
                cp -rn "$root_path/." "$persist_path/" 2>/dev/null || true
            fi
            rm -rf "$root_path"
        else
            cp -a "$root_path" "$persist_path"
            rm -rf "$root_path"
        fi
    fi

    if [ -e "$persist_path" ] && [ ! -e "$root_path" ]; then
        # Volume has it, root doesn't — create symlink
        ln -sf "$persist_path" "$root_path"
    elif [ ! -e "$persist_path" ] && [ ! -e "$root_path" ]; then
        # Neither exists — seed an empty dir or file in persist, then symlink
        case "$item" in
            *.*) touch "$persist_path" ;;
            *)   mkdir -p "$persist_path" ;;
        esac
        ln -sf "$persist_path" "$root_path"
    fi
done

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

# --- Preload rendiv-video skills globally for all agents ---
SKILLS_SRC="/app/packages/skills/rendiv-video"

if [ -d "$SKILLS_SRC" ]; then
  echo "Preloading rendiv-video skills..."

  # Claude Code — global personal skills
  mkdir -p "$HOME/.claude/skills"
  if [ ! -e "$HOME/.claude/skills/rendiv-video" ]; then
    ln -sfn "$SKILLS_SRC" "$HOME/.claude/skills/rendiv-video"
    echo "  Claude Code: linked"
  fi

  # Codex — global personal skills
  mkdir -p "$HOME/.codex/skills"
  if [ ! -e "$HOME/.codex/skills/rendiv-video" ]; then
    ln -sfn "$SKILLS_SRC" "$HOME/.codex/skills/rendiv-video"
    echo "  Codex: linked"
  fi
fi

exec "$@"
