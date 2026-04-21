-- +goose Up
CREATE TYPE order_status AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED');
CREATE TYPE payment_method AS ENUM ('MPESA', 'CARD', 'FREE');

CREATE TABLE "orders" (
    "id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id"        UUID NOT NULL,
    "event_id"       UUID NOT NULL,
    "ticket_type_id" UUID NOT NULL,
    "quantity"       INTEGER NOT NULL DEFAULT 1,
    "unit_price"     NUMERIC(10, 2) NOT NULL,
    "total_amount"   NUMERIC(10, 2) NOT NULL,
    "currency"       TEXT NOT NULL DEFAULT 'KES',
    "status"         order_status NOT NULL DEFAULT 'PENDING',
    "payment_method" payment_method,
    "payment_ref"    TEXT,
    "qr_code"        TEXT,
    "checked_in"     BOOLEAN NOT NULL DEFAULT FALSE,
    "checked_in_at"  TIMESTAMP(3),
    "created_at"     TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "updated_at"     TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
    CONSTRAINT "orders_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE,
    CONSTRAINT "orders_ticket_type_id_fkey" FOREIGN KEY ("ticket_type_id") REFERENCES "ticket_types"("id") ON DELETE CASCADE,
    CONSTRAINT "quantity_positive" CHECK ("quantity" > 0),
    CONSTRAINT "total_amount_positive" CHECK ("total_amount" >= 0)
);

CREATE INDEX "idx_orders_user_id" ON "orders"("user_id");
CREATE INDEX "idx_orders_event_id" ON "orders"("event_id");
CREATE INDEX "idx_orders_status" ON "orders"("status");
CREATE INDEX "idx_orders_payment_ref" ON "orders"("payment_ref");

-- +goose Down
DROP INDEX "idx_orders_payment_ref";
DROP INDEX "idx_orders_status";
DROP INDEX "idx_orders_event_id";
DROP INDEX "idx_orders_user_id";
DROP TABLE "orders";
DROP TYPE payment_method;
DROP TYPE order_status;