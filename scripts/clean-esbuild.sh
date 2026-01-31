#!/bin/bash
# Clean up stale esbuild processes to prevent EPIPE errors
# This script kills esbuild service processes that are no longer active

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_NAME="$(basename "$PROJECT_ROOT")"

echo "🧹 Cleaning up stale esbuild processes for $PROJECT_NAME..."

# Clean up esbuild cache (always do this)
echo "🗑️  Cleaning esbuild cache..."
rm -rf "$PROJECT_ROOT/apps/web/node_modules/.vite" 2>/dev/null || true
rm -rf "$PROJECT_ROOT/node_modules/.vite" 2>/dev/null || true
rm -rf "$PROJECT_ROOT/node_modules/.cache" 2>/dev/null || true
echo "✅ Cache cleaned"

echo "✨ Ready to start dev server!"
