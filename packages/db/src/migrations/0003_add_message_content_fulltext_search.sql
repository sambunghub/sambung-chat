-- Enable pg_trgm extension for trigram-based full-text search
-- This extension provides GIN index operator classes for efficient ILIKE queries
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
-- Create GIN index on messages.content for efficient full-text search
-- Uses gin_trgm_ops to support fast case-insensitive pattern matching (ILIKE)
CREATE INDEX IF NOT EXISTS "message_content_trgm_idx" ON "messages" USING gin (content gin_trgm_ops);