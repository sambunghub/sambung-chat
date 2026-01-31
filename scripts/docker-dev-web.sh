#!/bin/bash
# Docker dev script for web container
# Runs vite directly to avoid turbo/bun workspace issues

cd /app/apps/web
exec bun vite --host 0.0.0.0 --port 5174
