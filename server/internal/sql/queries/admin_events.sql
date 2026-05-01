-- name: AdminGetAllEvents :many
SELECT
    e.*,
    u."name" AS organiser_name
FROM "events" e
JOIN "users"  u ON u."id" = e."organiser_id"
ORDER BY e."created_at" DESC
LIMIT $1 OFFSET $2;

-- name: AdminGetEventsByStatus :many
SELECT
    e.*,
    u."name" AS organiser_name
FROM "events" e
JOIN "users"  u ON u."id" = e."organiser_id"
WHERE e."status" = $1
ORDER BY e."created_at" DESC
LIMIT $2 OFFSET $3;

-- name: AdminCancelEvent :one
UPDATE "events"
SET
    "status"     = 'CANCELLED',
    "updated_at" = NOW()
WHERE "id" = $1
RETURNING *;

-- name: AdminDeleteEvent :exec
UPDATE "events"
SET
    "status"     = 'DELETED',
    "updated_at" = NOW()
WHERE "id" = $1;




