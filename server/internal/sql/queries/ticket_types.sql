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

-- name: GetTicketTypesByEvent :many
SELECT * FROM "ticket_types"
WHERE "event_id" = $1
ORDER BY "price" ASC;

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

-- name: IncrementQuantitySold :one
UPDATE ticket_types
SET
    quantity_sold = quantity_sold + $2,
    updated_at = NOW()
WHERE id = $1
  AND quantity_sold + $2 <= quantity
RETURNING *;

-- name: DecrementQuantitySold :one
UPDATE ticket_types
SET
    quantity_sold = quantity_sold - $2,
    updated_at = NOW()
WHERE id = $1
  AND quantity_sold >= $2
RETURNING *;

-- name: GetAvailableTicketTypes :many
SELECT tt.*
FROM ticket_types tt
JOIN events e ON e.id = tt.event_id
WHERE tt.event_id = $1
  AND tt.quantity_sold < tt.quantity
  AND (tt.sale_starts IS NULL OR tt.sale_starts <= NOW())
  AND (tt.sale_ends IS NULL OR tt.sale_ends >= NOW())
  AND e.starts_at > NOW()
ORDER BY tt.price ASC;

-- name: DeleteTicketType :exec
DELETE FROM "ticket_types" WHERE "id" = $1;