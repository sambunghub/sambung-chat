# Esbuild EPIPE Error - Troubleshooting Guide

## Problem

When running `bun run dev:web` or `bun run build`, you may encounter:

```text
Error: The service was stopped: write EPIPE
    at /path/to/node_modules/vite/node_modules/esbuild/lib/main.js:949:34
```

## Root Cause

This error occurs when **multiple esbuild service processes** are running simultaneously from different projects. Each esbuild instance creates a long-running service process, and conflicts can occur when:

1. Multiple projects use esbuild on the same machine
2. Stale esbuild processes remain from previous dev sessions
3. esbuild's service mode communication channels become corrupted

## Solution

### 1. Automatic Cleanup (Recommended)

The project now includes automatic cleanup via `predev` hook:

```bash
bun run dev          # Automatically cleans before starting
bun run dev:clean    # Explicitly clean then start
```

### 2. Manual Cleanup

If automatic cleanup doesn't work:

```bash
# Kill all esbuild processes for this project
pkill -9 -f "esbuild.*sambung-chat"

# Clean caches manually
rm -rf apps/web/node_modules/.vite
rm -rf node_modules/.vite
rm -rf node_modules/.cache

# Restart dev server
bun run dev:web
```

### 3. Cleanup Script

The `scripts/clean-esbuild.sh` script:

- Identifies stale esbuild processes for this project
- Safely kills only stale/idle processes
- Clears esbuild and vite caches
- Can be run standalone: `bun run scripts/clean-esbuild.sh`

## Prevention

To prevent EPIPE errors:

### 1. Always Stop Dev Servers Properly

```bash
# Use Ctrl+C to stop the dev server cleanly
# Don't just close the terminal without stopping
```

### 2. Use the predev Hook

The `predev` script automatically runs before `bun run dev`, cleaning up stale processes.

### 3. Avoid Multiple Dev Sessions

Don't run multiple dev servers simultaneously in the same project directory.

## Technical Details

### Why This Happens

esbuild uses a **long-running service process** for performance:

- First start: Spawns a background service process
- Subsequent starts: Reuse the existing service
- Problem: Stale services from previous sessions can conflict

### How Our Fix Works

1. **predev Hook**: Runs cleanup before every `bun run dev`
2. **Vite Config**: Optimized to reduce esbuild service usage
3. **Cleanup Script**: Targeted removal of only stale processes

### Vite Config Changes

```ts
// Optimize dependency pre-bundling
optimizeDeps: {
  // Force optimization even when dependencies are linked
  force: false,
  // Include esbuild explicitly to prevent conflicts
  include: ['esbuild'],
},
```

## Monitoring

Check for running esbuild processes:

```bash
# List all esbuild processes
ps aux | grep esbuild | grep -v grep

# Check for stale services (processes in "ping" state)
pgrep -f "esbuild.*ping"
```

## Related Issues

- [esbuild issue #2172](https://github.com/evanw/esbuild/issues/2172) - EPIPE errors
- [Vite issue #20983](https://github.com/vitejs/vite/issues/20983) - esbuild service issues

## Last Updated

2026-01-22 - Implemented automatic cleanup solution
