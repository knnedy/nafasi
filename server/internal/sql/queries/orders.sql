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

-- name: GetUserTickets :many
SELECT
    o.id,
    o.quantity,
    o.status,
    o.qr_code,
    o.checked_in,
    o.checked_in_at,
    o.created_at,
    e.title       AS event_title,
    e.slug        AS event_slug,
    e.starts_at   AS event_starts_at,
    e.ends_at     AS event_ends_at,
    e.location    AS event_location,
    e.venue       AS event_venue,
    e.is_online   AS event_is_online,
    e.online_url  AS event_online_url,
    e.banner_url  AS event_banner_url,
    tt.name       AS ticket_type_name,
    tt.price      AS ticket_type_price
FROM "orders" o
JOIN "events" e       ON e.id = o.event_id
JOIN "ticket_types" tt ON tt.id = o.ticket_type_id
WHERE o.user_id = $1
AND o.status = 'PAID'
ORDER BY e.starts_at ASC;

-- name: DeleteOrder :exec
DELETE FROM "orders" WHERE "id" = $1;
