-- name: AdminGetOrdersByStatus :many
SELECT * FROM "orders"
WHERE "status" = $1
ORDER BY "created_at" DESC
LIMIT $2 OFFSET $3;

-- name: AdminGetRecentOrdersWithDetails :many
SELECT
    o.*,
    u."name"  AS user_name,
    u."email" AS user_email,
    e."title" AS event_title
FROM "orders" o
JOIN "users"  u ON u."id" = o."user_id"
JOIN "events" e ON e."id" = o."event_id"
ORDER BY o."created_at" DESC
LIMIT $1;
