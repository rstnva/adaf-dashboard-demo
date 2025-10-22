-- Fortune 500 schema hardening: capture external signal identifiers and tag arrays for Oracle Core.
ALTER TABLE "signals"
  ADD COLUMN "externalId" TEXT;

UPDATE "signals"
SET "externalId" = CONCAT("feedId", ':', to_char("ts" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
WHERE "externalId" IS NULL;

ALTER TABLE "signals"
  ALTER COLUMN "externalId" SET NOT NULL;

ALTER TABLE "signals"
  ADD CONSTRAINT "signals_externalId_key" UNIQUE ("externalId");

CREATE INDEX IF NOT EXISTS "signals_external_id_idx" ON "signals" ("externalId");

ALTER TABLE "signals"
  ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
