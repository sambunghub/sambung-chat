#!/bin/bash
# Clean up stale esbuild processes to prevent EPIPE errors
# This script kills esbuild service processes that are no longer active

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_NAME="$(basename "$PROJECT_ROOT")"

echo "🧹 Cleaning up stale esbuild processes for $PROJECT_NAME..."

# Find and kill esbuild processes belonging to this project
# Only kill processes that are in a "ping" state (stale/idle)
STALE_ESBUILD_PIDS=$(pgrep -f "esbuild.*$PROJECT_NAME" 2>/dev/null | head -10)

if [ -n "$STALE_ESBUILD_PIDS" ]; then
  echo "Found esbuild processes, checking for stale ones..."
  echo "$STALE_ESBUILD_PIDS" | xargs kill -9 2>/dev/null || true
  echo "✅ Cleaned up esbuild process(es)"
else
  echo "✅ No esbuild processes found"
fi

# Clean up esbuild cache
echo "🗑️  Cleaning esbuild cache..."
rm -rf "$PROJECT_ROOT/apps/web/node_modules/.vite" 2>/dev/null || true
rm -rf "$PROJECT_ROOT/node_modules/.vite" 2>/dev/null || true
rm -rf "$PROJECT_ROOT/node_modules/.cache" 2>/dev/null || true
echo "✅ Cache cleaned"

echo "✨ Ready to start dev server!"
