-- name: AdminGetOrdersByStatus :many
SELECT * FROM "orders"
WHERE "status" = $1
ORDER BY "created_at" DESC
LIMIT $2 OFFSET $3;

-- name: AdminGetLatestOrders :many
SELECT * FROM "orders"
ORDER BY "created_at" DESC
LIMIT $1;