DO $$ BEGIN
 CREATE TYPE "public"."swipe_action" AS ENUM('like', 'dislike');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "swipes" (
	"swiper_id" integer NOT NULL,
	"swiped_id" integer NOT NULL,
	"action" "swipe_action" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "swipes_swiper_id_swiped_id_pk" PRIMARY KEY("swiper_id","swiped_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "swipes" ADD CONSTRAINT "swipes_swiper_id_users_id_fk" FOREIGN KEY ("swiper_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "swipes" ADD CONSTRAINT "swipes_swiped_id_users_id_fk" FOREIGN KEY ("swiped_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "swiper_idx" ON "swipes" USING btree ("swiper_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "swiped_idx" ON "swipes" USING btree ("swiped_id");