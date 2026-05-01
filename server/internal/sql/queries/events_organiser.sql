-- name: OrganiserGetEvents :many
SELECT * FROM "events" 
WHERE "organiser_id" = $1
ORDER BY "created_at" DESC;


-- name: UpdateEventStatus :one
UPDATE "events"
SET
    "status"     = $2,
    "updated_at" = NOW()
WHERE "id" = $1
RETURNING *;
