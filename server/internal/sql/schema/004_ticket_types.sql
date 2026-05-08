-- +goose Up
CREATE TYPE ticket_type_status AS ENUM ('ACTIVE', 'DELETED');

CREATE TABLE "ticket_types" (
    "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "event_id"      UUID NOT NULL,
    "name"          TEXT NOT NULL,
    "status"        ticket_type_status NOT NULL DEFAULT 'ACTIVE',
    "description"   TEXT,
    "price"         BIGINT NOT NULL DEFAULT 0,
    "currency"      CHAR(3) NOT NULL DEFAULT 'KES',
    "quantity"      INTEGER NOT NULL,
    "quantity_sold" INTEGER NOT NULL DEFAULT 0,
    "is_free"       BOOLEAN NOT NULL DEFAULT FALSE,
    "sale_starts"   TIMESTAMP(3),
    "sale_ends"     TIMESTAMP(3),
    "created_at"    TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "updated_at"    TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    CONSTRAINT "ticket_types_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE,
    CONSTRAINT "quantity_sold_valid" CHECK ("quantity_sold" <= "quantity"),
    CONSTRAINT "price_positive" CHECK ("price" >= 0)
);

CREATE INDEX "idx_ticket_types_event_id" ON "ticket_types"("event_id");

-- +goose Down
DROP INDEX "idx_ticket_types_event_id";
DROP TABLE "ticket_types";
DROP TYPE "ticket_type_status";