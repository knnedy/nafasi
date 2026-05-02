-- name: GetOrdersByEvent :many
SELECT * FROM "orders"
WHERE "event_id" = $1
ORDER BY "created_at" DESC
LIMIT $2 OFFSET $3;

-- name: GetOrdersByEventAndStatus :many
SELECT * FROM "orders"
WHERE "event_id" = $1
AND "status" = $2
ORDER BY "created_at" DESC
LIMIT $3 OFFSET $4;

-- name: GetEventRevenue :one
SELECT COALESCE(SUM(total_amount), 0)::BIGINT AS revenue
FROM orders
WHERE event_id = $1
AND status = 'PAID';

-- name: GetEventOrdersCount :one
SELECT COUNT(*) AS total_orders
FROM orders
WHERE event_id = $1;

-- name: GetEventCheckedInCount :one
SELECT COUNT(*) AS checked_in
FROM orders
WHERE event_id = $1
AND checked_in = TRUE;

-- name: GetEventOrderStatusBreakdown :many
SELECT status, COUNT(*) AS count
FROM orders
WHERE event_id = $1
GROUP BY status;

-- name: GetEventTicketsSold :one
SELECT COALESCE(SUM(quantity), 0) AS tickets_sold
FROM orders
WHERE event_id = $1
AND status = 'PAID';

-- name: GetRecentEventOrders :many
SELECT * FROM "orders"
WHERE "event_id" = $1
ORDER BY "created_at" DESC
LIMIT $2;