CREATE TABLE "rate_limits" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"timestamp" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "rate_limit_identifier_idx" ON "rate_limits" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "rate_limit_timestamp_idx" ON "rate_limits" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "rate_limit_identifier_timestamp_idx" ON "rate_limits" USING btree ("identifier", "timestamp");
