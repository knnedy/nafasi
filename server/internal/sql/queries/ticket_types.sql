-- name: CreateTicketType :one
INSERT INTO "ticket_types" (
    "event_id",
    "name",
    "description",
    "price",
    "currency",
    "quantity",
    "is_free",
    "sale_starts",
    "sale_ends"
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9
) RETURNING *;

-- name: GetTicketTypeById :one
SELECT * FROM "ticket_types" WHERE "id" = $1;

-- name: UpdateTicketType :one
UPDATE "ticket_types"
SET
    "name"        = $2,
    "description" = $3,
    "price"       = $4,
    "currency"    = $5,
    "quantity"    = $6,
    "is_free"     = $7,
    "sale_starts" = $8,
    "sale_ends"   = $9,
    "updated_at"  = NOW()
WHERE "id" = $1
RETURNING *;

-- name: DeleteTicketType :exec
DELETE FROM "ticket_types" WHERE "id" = $1;