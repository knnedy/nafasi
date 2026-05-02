-- name: GetTicketTypesByEvent :many
SELECT * FROM "ticket_types"
WHERE "event_id" = $1
ORDER BY "price" ASC;

-- name: GetTicketTypeSalesByEvent :many
SELECT
    id,
    name,
    price,
    quantity,
    quantity_sold,
    (quantity_sold * price) AS revenue
FROM ticket_types
WHERE event_id = $1
ORDER BY price ASC;

-- name: GetTotalTicketsSold :one
SELECT COALESCE(SUM("quantity_sold"), 0)::BIGINT AS total_sold
FROM "ticket_types"
WHERE "event_id" = $1;

