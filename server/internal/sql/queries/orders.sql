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

-- name: GetOrdersByEventAndStatus :many
SELECT * FROM "orders"
WHERE "event_id" = $1
AND "status" = $2
ORDER BY "created_at" DESC;

-- -- name: GetTotalRevenue :one
-- SELECT COALESCE(SUM("total_amount"), 0) AS total_revenue
-- FROM "orders"
-- WHERE "status" = 'PAID';

-- -- name: GetLatestOrders :many
-- SELECT * FROM "orders"
-- ORDER BY "created_at" DESC
-- LIMIT $1;

-- -- name: GetOrdersByStatus :many
-- SELECT * FROM "orders"
-- WHERE "status" = $1
-- ORDER BY "created_at" DESC
-- LIMIT $2 OFFSET $3;

-- name: DeleteOrder :exec
DELETE FROM "orders" WHERE "id" = $1;
