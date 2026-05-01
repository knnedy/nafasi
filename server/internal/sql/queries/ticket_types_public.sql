-- name: PublicGetAvailableTicketTypes :many
SELECT tt.*
FROM ticket_types tt
JOIN events e ON e.id = tt.event_id
WHERE tt.event_id = $1
  AND tt.quantity_sold < tt.quantity
  AND (tt.sale_starts IS NULL OR tt.sale_starts <= NOW())
  AND (tt.sale_ends IS NULL OR tt.sale_ends >= NOW())
  AND e.starts_at > NOW()
ORDER BY tt.price ASC;