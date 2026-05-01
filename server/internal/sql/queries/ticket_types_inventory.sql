-- name: IncrementQuantitySold :one
UPDATE ticket_types
SET
    quantity_sold = quantity_sold + $2,
    updated_at = NOW()
WHERE id = $1
  AND quantity_sold + $2 <= quantity
RETURNING id;

-- name: DecrementQuantitySold :one
UPDATE ticket_types
SET
    quantity_sold = quantity_sold - $2,
    updated_at = NOW()
WHERE id = $1
  AND quantity_sold >= $2
RETURNING id;