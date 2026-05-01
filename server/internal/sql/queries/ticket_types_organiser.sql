-- name: OrganiserGetTicketTypesByEvent :many
SELECT * FROM "ticket_types"
WHERE "event_id" = $1
ORDER BY "price" ASC;
