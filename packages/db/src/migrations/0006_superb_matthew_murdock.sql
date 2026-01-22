ALTER TABLE "api_keys" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "bio" text;--> statement-breakpoint
CREATE INDEX "api_key_is_active_idx" ON "api_keys" USING btree ("is_active");