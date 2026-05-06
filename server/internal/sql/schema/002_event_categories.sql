-- +goose Up
CREATE TABLE "event_categories" (
    "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name"        TEXT NOT NULL,
    "description" TEXT,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "updated_at"  TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    CONSTRAINT "event_categories_name_key" UNIQUE ("name")
);

-- +goose Down
DROP TABLE "event_categories";