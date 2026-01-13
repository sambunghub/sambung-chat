# Dockerfile for SambaChat Web (SvelteKit)
# Multi-stage build for development and production

# ============================================
# Base stage - Dependencies
# ============================================
FROM oven/bun:1.2.23 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lock* ./
COPY packages packages/
COPY apps apps/
RUN bun install --frozen-lockfile

# ============================================
# Development stage
# ============================================
FROM base AS development
WORKDIR /app

# Copy all source files
COPY . .

# Expose port for Vite dev server
EXPOSE 5173

# Set environment for development
ENV NODE_ENV=development
ENV PORT=5173

# Change to web app directory and run dev server with host=0.0.0.0
# This bypasses turbo and runs vite directly with correct args
WORKDIR /app/apps/web
CMD ["bun", "run", "dev", "--", "--host", "0.0.0.0"]

# ============================================
# Builder stage - Build for production
# ============================================
FROM base AS builder
WORKDIR /app

# Copy all source files
COPY . .

# Build the application
RUN bun run build

# ============================================
# Production stage
# ============================================
FROM oven/bun:1.2.23 AS production
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Copy package files and install production dependencies only
COPY package.json bun.lock* ./
COPY packages packages/
COPY apps apps/
RUN bun install --frozen-lockfile --production

# Copy built files from builder
COPY --from=builder /app/apps/web/build ./apps/web/build
COPY --from=builder /app/apps/web/.svelte-kit/output ./

# Create non-root user
RUN addgroup -g 1001 -S sambungchat && \
    adduser -S sambungchat -u 1001 && \
    chown -R sambungchat:sambungchat /app

USER sambungchat

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Run production server
CMD ["bun", "run", "start"]
