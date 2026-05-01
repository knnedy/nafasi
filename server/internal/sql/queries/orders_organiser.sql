-- name: GetEventRevenue :one
SELECT COALESCE(SUM(total_amount), 0) AS revenue
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

-- name: GetEventOrders :many
SELECT *
FROM orders
WHERE event_id = $1
ORDER BY created_at DESC;