-- name: AdminGetTotalRevenue :one
SELECT COALESCE(SUM("total_amount"), 0)::BIGINT AS total_revenue
FROM "orders"
WHERE "status" = 'PAID';

-- name: AdminGetPlatformStats :one
SELECT
    (SELECT COUNT(*) FROM "users") AS total_users,
    (SELECT COUNT(*) FROM "users" WHERE "role" = 'ORGANISER') AS total_organisers,
    (SELECT COUNT(*) FROM "users" WHERE "role" = 'ATTENDEE') AS total_attendees,
    (SELECT COUNT(*) FROM "events") AS total_events,
    (SELECT COUNT(*) FROM "events" WHERE "status" = 'PUBLISHED') AS published_events,
    (SELECT COUNT(*) FROM "orders") AS total_orders,
    (SELECT COUNT(*) FROM "orders" WHERE "status" = 'PAID') AS paid_orders,
    (SELECT COALESCE(SUM("total_amount"), 0) FROM "orders" WHERE "status" = 'PAID') AS total_revenue;

