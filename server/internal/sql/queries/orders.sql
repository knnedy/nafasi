-- name: CreateOrder :one
INSERT INTO "orders" (
    "user_id",
    "event_id",
    "ticket_type_id",
    "quantity",
    "unit_price",
    "total_amount",
    "currency",
    "status",
    "payment_method"
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9
) RETURNING *;

-- name: GetOrderById :one
SELECT * FROM "orders" WHERE "id" = $1;

-- name: GetOrdersByUser :many
SELECT * FROM "orders"
WHERE "user_id" = $1
ORDER BY "created_at" DESC;

-- name: GetOrdersByEvent :many
SELECT * FROM "orders"
WHERE "event_id" = $1
ORDER BY "created_at" DESC;

-- name: GetOrderByPaymentRef :one
SELECT * FROM "orders"
WHERE "payment_ref" = $1;

-- name: GetOrderByQRCode :one
SELECT * FROM "orders"
WHERE "qr_code" = $1;

-- name: UpdateOrderStatus :one
UPDATE "orders"
SET
    "status"     = $2,
    "updated_at" = NOW()
WHERE "id" = $1
RETURNING *;

-- name: UpdateOrderPayment :one
UPDATE "orders"
SET
    "status"         = $2,
    "payment_method" = $3,
    "payment_ref"    = $4,
    "updated_at"     = NOW()
WHERE "id" = $1
RETURNING *;

-- name: UpdateOrderQRCode :one
UPDATE "orders"
SET
    "qr_code"    = $2,
    "updated_at" = NOW()
WHERE "id" = $1
RETURNING *;

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

-- name: GetOrdersByEventAndStatus :many
SELECT * FROM "orders"
WHERE "event_id" = $1
AND "status" = $2
ORDER BY "created_at" DESC;

-- name: DeleteOrder :exec
DELETE FROM "orders" WHERE "id" = $1;