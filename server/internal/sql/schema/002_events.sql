-- +goose Up
CREATE TYPE event_status AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED');

CREATE TABLE "events" (
    "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "organiser_id" UUID NOT NULL,
    "title"        TEXT NOT NULL,
    "slug"         TEXT NOT NULL,
    "description"  TEXT,
    "location"     TEXT,
    "venue"        TEXT,
    "banner_url"   TEXT,
    "starts_at"    TIMESTAMP(3) NOT NULL,
    "ends_at"      TIMESTAMP(3) NOT NULL,
    "status"       event_status NOT NULL DEFAULT 'DRAFT',
    "is_online"    BOOLEAN NOT NULL DEFAULT FALSE,
    "online_url"   TEXT,
    "created_at"   TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "updated_at"   TIMESTAMP(3),
    CONSTRAINT "events_slug_key" UNIQUE ("slug"),
    CONSTRAINT "events_organiser_id_fkey" FOREIGN KEY ("organiser_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX "idx_events_organiser_id" ON "events"("organiser_id");
CREATE INDEX "idx_events_status" ON "events"("status");
CREATE INDEX "idx_events_starts_at" ON "events"("starts_at");

-- +goose Down
DROP INDEX "idx_events_starts_at";
DROP INDEX "idx_events_status";
DROP INDEX "idx_events_organiser_id";
DROP TABLE "events";
DROP TYPE event_status;