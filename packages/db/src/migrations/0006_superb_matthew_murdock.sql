ALTER TABLE "api_keys" ADD COLUMN "name" text NULL;--> statement-breakpoint
UPDATE "api_keys" SET "name" = concat('API Key ', substring(id, 1, 8));--> statement-breakpoint
ALTER TABLE "api_keys" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "bio" text;--> statement-breakpoint
CREATE INDEX "api_key_is_active_idx" ON "api_keys" USING btree ("is_active");