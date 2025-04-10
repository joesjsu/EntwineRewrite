-- Add columns to track interest expressed by each user in a match
ALTER TABLE "matches" ADD COLUMN "interest_expressed_by_user1" BOOLEAN DEFAULT false;
ALTER TABLE "matches" ADD COLUMN "interest_expressed_by_user2" BOOLEAN DEFAULT false;

-- Add indexes for querying interest
CREATE INDEX IF NOT EXISTS idx_matches_user1_interest ON "matches" ("user1_id", "interest_expressed_by_user1");
CREATE INDEX IF NOT EXISTS idx_matches_user2_interest ON "matches" ("user2_id", "interest_expressed_by_user2");

-- Optionally, update existing rows where matched = true to set both flags
-- UPDATE "matches" SET "interest_expressed_by_user1" = true, "interest_expressed_by_user2" = true WHERE "matched" = true;
-- Note: Decide if you want to backfill this data based on your existing logic.