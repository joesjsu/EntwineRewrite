CREATE TABLE IF NOT EXISTS "ai_feature_configs" (
	"feature_key" varchar(100) PRIMARY KEY NOT NULL,
	"provider_name" varchar(50) NOT NULL,
	"model_name" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "feature_key_idx" ON "ai_feature_configs" USING btree ("feature_key");