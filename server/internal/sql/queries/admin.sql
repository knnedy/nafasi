-- name: GetPlatformStats :one
SELECT
    (SELECT COUNT(*) FROM "users") AS total_users,
    (SELECT COUNT(*) FROM "users" WHERE "role" = 'ORGANISER') AS total_organisers,
    (SELECT COUNT(*) FROM "users" WHERE "role" = 'ATTENDEE') AS total_attendees,
    (SELECT COUNT(*) FROM "events") AS total_events,
    (SELECT COUNT(*) FROM "events" WHERE "status" = 'PUBLISHED') AS published_events,
    (SELECT COUNT(*) FROM "orders") AS total_orders,
    (SELECT COUNT(*) FROM "orders" WHERE "status" = 'PAID') AS paid_orders,
    (SELECT COALESCE(SUM("total_amount"), 0) FROM "orders" WHERE "status" = 'PAID') AS total_revenue;

-- name: GetRecentOrders :many
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

-- name: GetAllEvents :many
SELECT
    e.*,
    u."name" AS organiser_name
FROM "events" e
JOIN "users" u ON u."id" = e."organiser_id"
ORDER BY e."created_at" DESC
LIMIT $1 OFFSET $2;

-- name: GetEventsByStatus :many
SELECT
    e.*,
    u."name" AS organiser_name
FROM "events" e
JOIN "users" u ON u."id" = e."organiser_id"
WHERE e."status" = $1
ORDER BY e."created_at" DESC
LIMIT $2 OFFSET $3;