-- name: GetOrderByQRCode :one
SELECT * FROM "orders"
WHERE "qr_code" = $1;

-- name: CheckInOrder :one
UPDATE "orders"
SET
    "checked_in"    = TRUE,
    "checked_in_at" = NOW(),
    "updated_at"    = NOW()
WHERE "id" = $1
AND "checked_in" = FALSE
RETURNING *;

-- name: GetCheckedInOrders :many
SELECT * FROM "orders"
WHERE "event_id" = $1
AND "checked_in" = TRUE
ORDER BY "checked_in_at" ASC;