CREATE TABLE "agents" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"system_prompt" text NOT NULL,
	"model_id" text NOT NULL,
	"temperature" jsonb DEFAULT '0.7'::jsonb,
	"max_tokens" jsonb DEFAULT '2048'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "models" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider" text NOT NULL,
	"model_id" text NOT NULL,
	"name" text NOT NULL,
	"base_url" text,
	"api_key_id" text,
	"is_active" boolean DEFAULT false NOT NULL,
	"avatar_url" text,
	"settings" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Drop existing foreign key constraints before altering column types
ALTER TABLE "messages" DROP CONSTRAINT IF EXISTS "messages_chat_id_chats_id_fk";--> statement-breakpoint
ALTER TABLE "chats" DROP CONSTRAINT IF EXISTS "chats_folder_id_folders_id_fk";--> statement-breakpoint
--> statement-breakpoint
-- Alter column types from serial/integer to text
ALTER TABLE "api_keys" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "chats" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "chats" ALTER COLUMN "folder_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "folders" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "chat_id" SET DATA TYPE text;--> statement-breakpoint
--> statement-breakpoint
-- Recreate foreign key constraints after column type changes
ALTER TABLE "chats" ADD CONSTRAINT "chats_folder_id_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."folders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompts" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "name" text;--> statement-breakpoint
UPDATE "api_keys" SET "name" = CONCAT('API Key ', id) WHERE "name" IS NULL;--> statement-breakpoint
ALTER TABLE "api_keys" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "models" ADD CONSTRAINT "models_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "models" ADD CONSTRAINT "models_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_user_id_idx" ON "agents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "agent_is_active_idx" ON "agents" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "model_user_id_idx" ON "models" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "model_provider_idx" ON "models" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "model_is_active_idx" ON "models" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "api_key_is_active_idx" ON "api_keys" USING btree ("is_active");